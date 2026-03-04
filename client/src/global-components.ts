export interface WebDeskGlobalComponentsRegistration {}

type WdAuthGateType = typeof import('./components/framework/WdAuthGate.vue')['default']
type WdDesktopType = typeof import('./components/framework/WdDesktop.vue')['default']
type WdDialogType = typeof import('./components/framework/WdDialog.vue')['default']
type WdLoginFormType = typeof import('./components/framework/WdLoginForm.vue')['default']
type WdTaskbarType = typeof import('./components/framework/WdTaskbar.vue')['default']
type WdTopMenuType = typeof import('./components/framework/WdTopMenu.vue')['default']
type WdTopMenuDropdownType = typeof import('./components/framework/WdTopMenuDropdown.vue')['default']
type WdTopMenuItemsType = typeof import('./components/framework/WdTopMenuItems.vue')['default']
type WdWindowType = typeof import('./components/framework/WdWindow.vue')['default']

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    WdAuthGate: WdAuthGateType
    'wd-auth-gate': WdAuthGateType
    WdDesktop: WdDesktopType
    'wd-desktop': WdDesktopType
    WdDialog: WdDialogType
    'wd-dialog': WdDialogType
    WdLoginForm: WdLoginFormType
    'wd-login-form': WdLoginFormType
    WdTaskbar: WdTaskbarType
    'wd-taskbar': WdTaskbarType
    WdTopMenu: WdTopMenuType
    'wd-top-menu': WdTopMenuType
    WdTopMenuDropdown: WdTopMenuDropdownType
    'wd-top-menu-dropdown': WdTopMenuDropdownType
    WdTopMenuItems: WdTopMenuItemsType
    'wd-top-menu-items': WdTopMenuItemsType
    WdWindow: WdWindowType
    'wd-window': WdWindowType
  }
}

declare module 'vue' {
  export interface GlobalComponents {
    WdAuthGate: WdAuthGateType
    'wd-auth-gate': WdAuthGateType
    WdDesktop: WdDesktopType
    'wd-desktop': WdDesktopType
    WdDialog: WdDialogType
    'wd-dialog': WdDialogType
    WdLoginForm: WdLoginFormType
    'wd-login-form': WdLoginFormType
    WdTaskbar: WdTaskbarType
    'wd-taskbar': WdTaskbarType
    WdTopMenu: WdTopMenuType
    'wd-top-menu': WdTopMenuType
    WdTopMenuDropdown: WdTopMenuDropdownType
    'wd-top-menu-dropdown': WdTopMenuDropdownType
    WdTopMenuItems: WdTopMenuItemsType
    'wd-top-menu-items': WdTopMenuItemsType
    WdWindow: WdWindowType
    'wd-window': WdWindowType
  }
}
