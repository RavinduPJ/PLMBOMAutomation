import { HttpClient, HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { Observable, of, throwError } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";
import { loginAPI } from "../common/consts";


import { LoginRequestModal, LoginResponseModal } from "./login-modal";


@Injectable()
export class LoginService {

    constructor(private http: HttpClient, private cs: CookieService) {

    }

    sysLogin(username: string, password: string): Observable<LoginResponseModal> {
        const req = new LoginRequestModal()
        req.username = username
        req.password = password
        console.log('in-login')
        console.log(req)
        return this.http.post(loginAPI, req, {
            headers: new HttpHeaders({
                'Content-type': 'application/json'
            })
        }
        ).pipe(map(s => {
            const resp = new LoginResponseModal()
            resp.token = (<any>s).cookie
            resp.userName = username
            resp.user_id = (<any>s).user_id
            resp.type = (<any>s).type
            resp.role = (<any>s).desc

            return resp



        })
        ).pipe(catchError((xx: HttpErrorResponse) => {
            console.log(xx)
            //return of()
            return throwError(xx.error.error)
        }))

    }
    sysLogout(): Observable<void> {
        return this.http.delete(loginAPI,  {
            headers: new HttpHeaders({
                'Content-type': 'application/json',
                'token': this.cs.get('token')
            })
        }).pipe(
            map(() => { return })
        ).pipe(catchError((xx: HttpErrorResponse) => {
            console.log(xx)
            //return of()
            return throwError(xx.error.error)
        }))
    }
}