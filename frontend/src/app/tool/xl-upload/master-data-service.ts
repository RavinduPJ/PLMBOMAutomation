import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable, OnInit } from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { bomEP, CommonRequest, customerEP, seasonEP, silhouetteEP, styleEP } from "src/app/common/consts";
import { BOM, BOMResponseModal, Customer, CustomerResponseModal, Season, SeasonResponseModal, Silhouette, Style, StyleResponseModal } from "./master-data-modal";

@Injectable()
export class MasterDataService  {
    constructor(private http: HttpClient, private cs: CookieService) {

    }

  
    private getHeaders() : HttpHeaders{
        return new HttpHeaders({
            'Content-type': 'application/json',
            'token': this.cs.get('token')
        });
    }




    customers(uid: number = null): Observable<CustomerResponseModal> {
        const req = new CommonRequest()
        req.cookie = this.cs.get('token')
        const webCall = this.http.get(uid == null ? customerEP : `${customerEP}?userId=${uid}`, {
            headers: this.getHeaders(),

        }
        ).pipe(map(s => {
            const resp = new CustomerResponseModal()
          
            resp.customers = (s as Customer[])

            return resp
        }))
            .pipe(catchError((xx: HttpErrorResponse) => {
                console.log(xx)
                //return of()
                return throwError(xx.error.error)
            }))


        return webCall
    }
    seasons(customerID: string): Observable<SeasonResponseModal> {
        const seasonFinalEP = seasonEP.replace('_s_id', customerID)
        return this.http.get(seasonFinalEP, {
            headers: this.getHeaders()
        }
        ).pipe(map(s => {
            const resp = new SeasonResponseModal()
            
            resp.seasons = (s as Season[])
            return resp
        })).pipe(catchError((err: HttpErrorResponse) => {
            return throwError(err.error.error)
        }))
    }
    styles(seasonID: string): Observable<StyleResponseModal> {
        const finalStyleEP = styleEP.replace('_s_id', seasonID)
        return this.http.get(finalStyleEP, {
            headers: this.getHeaders()
        }).pipe(map(s => {
            const resp = new StyleResponseModal()
     
            resp.styles = (s as Style[])
            return resp

        })).pipe(catchError((err: HttpErrorResponse) => {
            return throwError(err.error.error)
        }))
    }
    boms(styleID: string): Observable<BOMResponseModal> {
        const finalBOMEP = bomEP.replace('_s_id', styleID)
        return this.http.get(finalBOMEP, {
            headers: this.getHeaders()
        }).pipe(map(s => {
            const resp = new BOMResponseModal()
           
            resp.boms = (s as BOM[])
            return resp
        })).pipe(catchError((err: HttpErrorResponse) => {
            return throwError(err.error.error)
        }))
    }
    silhouette(): Observable<Silhouette[]> {
        return this.http.get(silhouetteEP, { headers: this.getHeaders() })
            .pipe(
                map(
                    (res: Silhouette[]) => {
                        return (res)
                    }
                )
            ).pipe(catchError((err: HttpErrorResponse) => {
                return throwError(err.error.error)
            }))
    }
}