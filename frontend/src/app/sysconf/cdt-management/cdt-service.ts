import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, pipe, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { cdtEP } from "src/app/common/consts";
import { ServiceError } from "src/app/common/error";
import { CDTElement, CDTRequest } from "./cdt-rqrs";

@Injectable()
export class CDTService {
    headers: HttpHeaders
    constructor(private http: HttpClient) {
        this.headers = new HttpHeaders({
            'Content-type': 'application/json'
        })
    }

    existingCDT(): Observable<CDTElement[]> {
        return this.http.get(cdtEP, { headers: this.headers })
            .pipe(
                map(
                    (r: CDTElement[]) => {

                        return r
                    }
                )
            )
            .pipe(
                catchError(
                    (e) => {
                        const errx = new ServiceError()
                        errx.code = e.status
                        errx.message = e.error.error

                        return throwError(errx)
                    }
                )
            )
    }

    addCDT(ldc: string, plm: string): Observable<void> {
        const req: CDTRequest = new CDTRequest()

        req.cdt_ldc = ldc
        req.cdt_plm = plm

        return this.http.post(cdtEP, req, { headers: this.headers })
            .pipe(
                map(
                    () => {
                        return
                    }
                )
            )
            .pipe(catchError(
                e => {
                    const errx = new ServiceError()
                    errx.code = e.status
                    errx.message = e.error.error

                    return throwError(errx)
                }
            ))
    }

    setActiveState(id: number, newState: boolean) {
        const req: CDTRequest = new CDTRequest()

        req.cdt_act = newState
        req.cdt_ldc = undefined
        req.cdt_plm = undefined

        return this.http.patch(`${cdtEP}/${id}`, req, { headers: this.headers })
            .pipe(
                map(
                    () => { return }
                )
            )
            .pipe(
                catchError(
                    (e) => {
                        const errx = new ServiceError()
                        errx.code = e.status
                        errx.message = e.error.error

                        return throwError(errx)
                    }
                )
            )
    }

    updateCDT(id: number, ldcstr: string, plmstr: string) {
        const req: CDTRequest = new CDTRequest()
        req.cdt_act = undefined
        if (!ldcstr || ldcstr.trim() == '') {
            req.cdt_ldc = undefined
        } else {
            req.cdt_ldc = ldcstr.trim()
        }

        if (!plmstr || plmstr.trim() == '') {
            req.cdt_plm = undefined
        } else {
            req.cdt_plm = plmstr.trim()
        }

        return this.http.patch(`${cdtEP}/${id}`, req, { headers: this.headers })
            .pipe(
                map(
                    () => { return }
                )
            )
            .pipe(
                catchError(
                    (e) => {
                        const errx = new ServiceError()
                        errx.code = e.status
                        errx.message = e.error.error

                        return throwError(errx)
                    }
                )
            )


    }

    deleteCDT(id: number): Observable<void> {
        return this.http.delete(`${cdtEP}/${id}`, { headers: this.headers })
            .pipe(
                map(
                    () => {
                        return
                    }
                )
            )
            .pipe(
                catchError(

                    (e) => {
                        const errx = new ServiceError()
                        errx.code = e.status
                        errx.message = e.error.error

                        return throwError(errx)
                    }
                )
            )
    }
}