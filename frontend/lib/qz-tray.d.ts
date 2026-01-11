declare module 'qz-tray' {
  const qz: any
  export default qz
}

declare global {
  interface Window {
    qz?: any
  }
}

export {}
