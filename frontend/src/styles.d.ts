/// <reference types="vite/client" />

declare module '*.scss'

declare module '*.module.scss' {
  const classes: { [key: string]: string }
  export default classes
}