import * as path from 'path';
import { diffFiles } from '../host';
import { upath } from '../core';
import createFileHandler from './createFileHandler';
import * as vscode from 'vscode';

export const diff = createFileHandler({
  name: 'diff',
  async handle() {
    const localFsPath = this.target.localFsPath;
    const tmpUri = this.target.remoteUri.with({
      path: '/~ ' + upath.basename(this.target.remoteUri.path),
    });
    await diffFiles(
      tmpUri,
      vscode.Uri.file(localFsPath),
      `${path.basename(localFsPath)} (${this.fileService.name || 'remote'} ↔ local)`
    );
  },
});
