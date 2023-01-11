import { HttpClient, HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { roleEP, userEP } from "src/app/common/consts";
import { ServiceError } from "src/app/common/error";
import { CreateUserRequest, RoleInfo, SingleUserResponse, UserElement } from "./user-rqrs";

@Injectable()
export class UserService {
    private token: string
    private headers: HttpHeaders 

    constructor(private http: HttpClient, private cs: CookieService) {
        this.token = cs.get('token')
        this.headers =  new HttpHeaders({
            'Content-Type': 'application/json',
            'token' : this.token
        })
    }


    allUsers(): Observable<UserElement[]> {
        return this.http.get(userEP, {
            headers: this.headers
        }).pipe(
            map((ret: UserElement[]) => {
                return ret
            })
        ).pipe(
            catchError((e: HttpErrorResponse) => {
                const err = new ServiceError()
                err.code = e.status
                err.message = `${e.error.error}`

                return throwError(err)
            }
            )
        )
    }

    singleUser(id: number) : Observable<SingleUserResponse> {
        return this.http.get(`${userEP}/${id}`, {headers:this.headers})
        .pipe(map( (r:SingleUserResponse) => {
            return r
        })).pipe(catchError((err: HttpErrorResponse) => {
            const errx = new ServiceError()
            errx.code = err.status
            errx.message = err.error.error

            return throwError(errx)
        }))
    }

    deleteUser(id: number) : Observable<void> {
        return this.http.delete(`${userEP}/${id}`, {headers:this.headers})
        .pipe(map( () => {
            return
        })).pipe(catchError((err: HttpErrorResponse) => {
            const errx = new ServiceError()
            errx.code = err.status
            errx.message = err.error.error

            return throwError(errx)
        }))
    }

    deleteCustomer(userId: number, customerId: number) : Observable<void> {
        return this.http.delete(`${userEP}/${userId}/customers/${customerId}`, {headers:this.headers})
        .pipe(map(r => {})).pipe(catchError((err: HttpErrorResponse) =>{
            const errx = new ServiceError()
            errx.code = err.status
            errx.message = err.error.error

            return throwError(errx)
        } ))
    }

    addCustomer(userId: number, customerName: string) : Observable<void> {
        return this.http.post(`${userEP}/${userId}/customers`, {customer_name:customerName} , {headers:this.headers})
        .pipe(map(() => {}))
        .pipe(catchError((err: HttpErrorResponse) => {
            const errx = new ServiceError()
            errx.code = err.status
            errx.message = err.error.error
            console.log(err)
            return throwError(errx)
        }))
    }

    getRoles() : Observable<RoleInfo[]> {
        return this.http.get(roleEP, {headers: this.headers})
        .pipe(map((rinf:RoleInfo[]) => {
            
            return rinf
        })
        ).pipe(catchError((e: HttpErrorResponse) => {
            const err: ServiceError = {
                code: e.status,
                message: e.error.error
            }
            return throwError(err)
        }))

    }

    addUser(username: string, role: number) : Observable<void> {
        const rq : CreateUserRequest = {
            username: username,
            role: role 
        }

        return this.http.post(userEP, rq, {headers:this.headers})
        .pipe(map(res => {
            return
        }))
        .pipe(catchError((e: HttpErrorResponse) => {
            const err: ServiceError = {
                code: e.status,
                message: e.error.error
            }
            return throwError(err)
        }))
    }
}