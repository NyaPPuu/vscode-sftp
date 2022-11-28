import * as path from 'path';
import { FileSystem } from './fs';
import { window } from 'vscode';
import { Readable } from 'stream';
import logger from '../logger';
import { makeTmpFile } from '../helper';
import { EXTENSION_NAME } from '../constants';
import { fileOperations } from '.';

interface FileOption {
  mode?: number;
}

export async function transferFile(
  src: string,
  des: string,
  srcFs: FileSystem,
  desFs: FileSystem,
  option?: FileOption
): Promise<void> {
  const inputStream = await srcFs.get(src, option);
  await desFs.put(inputStream, des, option);
}

export function transferSymlink(
  src: string,
  des: string,
  srcFs: FileSystem,
  desFs: FileSystem,
  option: FileOption
): Promise<void> {
  return srcFs.readlink(src).then(targetPath => {
    return desFs.symlink(targetPath, des).catch(err => {
      // ignore file already exist
      if (err.code === 4 || err.code === 'EEXIST') {
        return;
      }
      throw err;
    });
  });
}

export function removeFile(path: string, fs: FileSystem, option): Promise<void> {
  return fs.unlink(path);
}

export function removeDir(path: string, fs: FileSystem, option): Promise<void> {
  return fs.rmdir(path, true);
}

export function rename(srcPath: string, destPath: string, fs: FileSystem): Promise<void> {
  return fs.rename(srcPath, destPath);
}

export function createDir(path: string, fs: FileSystem, option): Promise<void> {
  return fs.mkdir(path);
}

export async function createFile(path: string, fs: FileSystem, option): Promise<void> {
  try {
    await fs.lstat(path);
    logger.warn(`Can't create file becase file already exist`);
    window.showErrorMessage(`Can't create file becase file already exist`);
    return;
  } catch (error) {

  }

  const targetFd = await fs.open(path, 'w');
  const s = new Readable();
  s._read = () => { };
  s.push(null);
  return fs.put(s, path, { fd: targetFd });
}

export async function diffRemote(
  localFsPath: string,
  remoteFsPath: string,
  localFs: FileSystem,
  remoteFs: FileSystem
) {
  try {
    const tmpPath = await makeTmpFile({
      prefix: `${EXTENSION_NAME}-`,
      postfix: path.extname(localFsPath),
    });

    await fileOperations.transferFile(remoteFsPath, tmpPath, remoteFs, localFs);

    const localContent = await (await localFs.readFile(localFsPath)).toString();
    const remoteContent = await (await remoteFs.readFile(remoteFsPath)).toString();
    logger.log('localContent', localContent);
    logger.log('remoteContent', remoteContent);
    logger.log('isSame', localContent === remoteContent);
  } catch (error) {
    logger.error('error', error);
  }
}
