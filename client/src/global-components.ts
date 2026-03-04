export interface WebDeskGlobalComponentsRegistration {}

declare module 'vue' {
  export interface GlobalComponents {
    WdAuthGate: typeof import('./lib')['WdAuthGate']
    'wd-auth-gate': typeof import('./lib')['WdAuthGate']
    WdDesktop: typeof import('./lib')['WdDesktop']
    'wd-desktop': typeof import('./lib')['WdDesktop']
    WdDialog: typeof import('./lib')['WdDialog']
    'wd-dialog': typeof import('./lib')['WdDialog']
    WdLoginForm: typeof import('./lib')['WdLoginForm']
    'wd-login-form': typeof import('./lib')['WdLoginForm']
    WdTaskbar: typeof import('./lib')['WdTaskbar']
    'wd-taskbar': typeof import('./lib')['WdTaskbar']
    WdTopMenu: typeof import('./lib')['WdTopMenu']
    'wd-top-menu': typeof import('./lib')['WdTopMenu']
    WdTopMenuDropdown: typeof import('./lib')['WdTopMenuDropdown']
    'wd-top-menu-dropdown': typeof import('./lib')['WdTopMenuDropdown']
    WdTopMenuItems: typeof import('./lib')['WdTopMenuItems']
    'wd-top-menu-items': typeof import('./lib')['WdTopMenuItems']
    WdWindow: typeof import('./lib')['WdWindow']
    'wd-window': typeof import('./lib')['WdWindow']
  }
}
