"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  onClose?: () => void;
};

type State = {
  error: Error | null;
};

/** 捕获弹窗内渲染异常，避免整块变成空白。 */
export class ModalErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[UploadModal]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="modal-error">
          <p className="modal-error__title">编辑器加载失败</p>
          <p className="modal-error__desc">
            {this.state.error.message || "请关闭后重试；若反复出现，请刷新页面。"}
          </p>
          <div className="modal-error__actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => this.setState({ error: null })}
            >
              重试
            </button>
            {this.props.onClose ? (
              <button
                type="button"
                className="btn btn--primary"
                onClick={this.props.onClose}
              >
                关闭
              </button>
            ) : null}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
