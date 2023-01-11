import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AppMainComponent } from './app-main.component';
import { LoginComponent } from './login/login-component';
import { MatAutocompleteModule} from '@angular/material/autocomplete'
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRippleModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { routes } from './routes';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service'
import { LayoutComponent } from './layout/layout-component';
import { XLUploadComponent } from './tool/xl-upload/xl-upload-component';
import { HttpClientModule } from '@angular/common/http';
import { LoginService } from './login/login-service';
import { ExcelEditComponent } from './tool/xl-upload/xl-edit.component';
import { MasterDataService } from './tool/xl-upload/master-data-service';
import { BOMService } from './tool/xl-upload/bom-service';
import { ErrorBoxLibraryComponent } from './tool/xl-upload/error-box-lib-component';
import { LoaderComponent } from './tool/xl-upload/loader-component';
import { ConfigMainComponent } from './sysconf/config-main-component';
import { UserManagementComponent } from './sysconf/user-management/user-management-component';
import { UserService } from './sysconf/user-management/user-service';
import { CDTManagementComponent } from './sysconf/cdt-management/cdt-mnagement-component';
import { CDTService } from './sysconf/cdt-management/cdt-service';
import { HistoryService } from './tool/history/history-service';
import { HistoryComponent } from './tool/history/history-component';
import { HistoryDatePipe } from './common/history-date-pipe';
import { PreventForLowUsers, PreventForNormalUsers, PreventInWithoutTokenService } from './tool/route-guard';
import { ToastrModule } from 'ngx-toastr';


@NgModule({
  declarations: [
    LoginComponent,
    AppMainComponent,
    LayoutComponent,
    XLUploadComponent,
    ExcelEditComponent,
    ErrorBoxLibraryComponent,
    LoaderComponent,
    ConfigMainComponent,
    UserManagementComponent,
    CDTManagementComponent,
    HistoryComponent,
    HistoryDatePipe
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    MatButtonModule,
    BrowserAnimationsModule,
    MatAutocompleteModule,
    MatCardModule,
    MatInputModule,
    MatExpansionModule,
    MatRippleModule,
    MatMenuModule,
    MatIconModule,
    MatTooltipModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatProgressBarModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ToastrModule.forRoot({
      positionClass: 'toast-top-right',
      closeButton: true,
      timeOut: 15000, // 15 seconds
      progressBar: true,
    }),
  ],
  providers: [
    CookieService,
    LoginService,
    MasterDataService,
    BOMService,
    UserService,
    CDTService,
    HistoryService,
    PreventForNormalUsers,
    PreventInWithoutTokenService,
    PreventForLowUsers

  ]
  ,
  bootstrap: [AppMainComponent]
})
export class AppModule {
  loggedIn: boolean
}
