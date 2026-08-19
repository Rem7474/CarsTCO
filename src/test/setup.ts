import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement <dialog> modal behavior (showModal/close) — polyfill just enough
// for ConfirmDialog: reflect `open` and fire the `close` event, same as a real browser.
if (typeof HTMLDialogElement !== 'undefined') {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    }
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    }
  }
}

// jsdom doesn't implement ResizeObserver — stub it out so components that
// observe element size (e.g. ScrollableTableCard) can mount under test.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
