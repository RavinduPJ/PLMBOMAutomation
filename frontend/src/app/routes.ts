import { Routes } from "@angular/router";
import { LayoutComponent } from "./layout/layout-component";
import { LoginComponent } from "./login/login-component";
import { CDTManagementComponent } from "./sysconf/cdt-management/cdt-mnagement-component";
import { ConfigMainComponent } from "./sysconf/config-main-component";
import { UserManagementComponent } from "./sysconf/user-management/user-management-component";
import { HistoryComponent } from "./tool/history/history-component";
import { PreventForLowUsers, PreventForNormalUsers, PreventInWithoutTokenService } from "./tool/route-guard";
import { XLUploadComponent } from "./tool/xl-upload/xl-upload-component";


export const routes: Routes = [
    { path: '', component: LoginComponent },
    {
        path: 'tool', component: LayoutComponent,
        children: [
            {
                path: 'b',
                component: XLUploadComponent
            }
        ],canActivate: [PreventInWithoutTokenService]
    },
    {
        path: 'sysconf', component: LayoutComponent,
        children: [
            {
                path : '',
                component: ConfigMainComponent,
                children : [
                    {
                        path : 'usm',
                        component : UserManagementComponent,
                        canActivate : [PreventForNormalUsers]
                    },
                    {
                        path : 'cdt',
                        component : CDTManagementComponent,
                        canActivate : [PreventForLowUsers]
                    }
                ]
            }
        ],canActivate: [PreventInWithoutTokenService]
    },
    {
        path: 'history', component: LayoutComponent,
        children: [
            {
                path:'',
                component: HistoryComponent
            }
        ],canActivate: [PreventInWithoutTokenService]
    }
] 