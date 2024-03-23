import type { ComputedView, LikeC4Model, ViewID } from '@likec4/core'
import type { BuildDocumentsParams, ChangeViewRequest, LocateParams } from '@likec4/language-server/protocol'
import type * as vscode from 'vscode'
import type { BaseLanguageClient as LanguageClient } from 'vscode-languageclient'
import type { DocumentUri, Location } from 'vscode-languageserver-protocol'
import { NotificationType, RequestType, RequestType0 } from 'vscode-languageserver-protocol'
import { Logger } from '../logger'
import { AbstractDisposable } from '../util'

// #region From server
const onDidChangeModel = new NotificationType<string>('likec4/onDidChangeModel')
// #endregion

// #region To server
const fetchModel = new RequestType0<{ model: LikeC4Model | null }, void>(
  'likec4/fetchModel'
)
const computeView = new RequestType<{ viewId: ViewID }, { view: ComputedView | null }, void>(
  'likec4/computeView'
)

const buildDocuments = new RequestType<BuildDocumentsParams, void, void>('likec4/build')

const locate = new RequestType<LocateParams, Location | null, void>('likec4/locate')
const changeView = new RequestType<ChangeViewRequest, Location | null, void>('likec4/change-view')

// // //#endregion

export class Rpc extends AbstractDisposable {
  constructor(public readonly client: LanguageClient) {
    super()
  }

  override dispose() {
    super.dispose()
    Logger.info(`[Extension.Rpc] disposed`)
  }

  onDidChangeModel(cb: () => void): vscode.Disposable {
    const disposable = this.client.onNotification(onDidChangeModel, cb)
    this.onDispose(() => disposable.dispose())
    return disposable
  }

  async fetchModel() {
    const { model } = await this.client.sendRequest(fetchModel)
    return model
  }

  async computeView(viewId: ViewID) {
    const { view } = await this.client.sendRequest(computeView, { viewId })
    return view
  }

  async buildDocuments(docs: DocumentUri[]) {
    await this.client.sendRequest(buildDocuments, { docs })
  }

  async locate(params: LocateParams): Promise<Location | null> {
    return await this.client.sendRequest(locate, params)
  }

  async changeView(req: ChangeViewRequest) {
    return await this.client.sendRequest(changeView, req)
  }
}
