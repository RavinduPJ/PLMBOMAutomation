import { HttpClient, HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { cwbEP, cwEP, gmtEP, matchEP, parseEP, prsEP, rmcEP } from "src/app/common/consts";
import { ServiceError } from "src/app/common/error";
import { GMLibraryInfo, RMLibraryInfo } from "src/app/modal/LibrayUploadModal";
import { ColorWayInfo, ColorWayToStyleRequest, ColorWayToStyleResponse } from "../requestsresponses/add_colorway_to_style";
import { GMTInfo, GMTRequest, GMTResponse } from "../requestsresponses/gmt";
import { ParsedItem, ParseRequest, ParseResponse } from "../requestsresponses/parse";
import { ProcessedRMGMREFElement, ProcessRMGMREFRequest, ProcessRMGMREFResponse } from "../requestsresponses/process_rm_gm_ref";
import { RMInfo, RMRequest, RMResponse } from "../requestsresponses/rmc";

@Injectable()
export class BOMService {
    private token: string
    constructor(private http: HttpClient, private cs: CookieService) {

    }

    private getHeaders(): HttpHeaders {
        return new HttpHeaders({
            'Content-type': 'application/json',
            'token': this.cs.get('token')
        });
    }

    parseExcel(req: ParseRequest): Observable<ParseResponse> {
        return this.http.post(parseEP, req.parse_data, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' })
        }
        ).pipe(
            map((r: ParsedItem[]) => {
                const x = new ParseResponse()
                x.parsed_data = r
                return x
            }

            )
        ).pipe(
            catchError((e: HttpErrorResponse) => {
                const err = new ServiceError()
                err.code = e.status
                err.message = `${e.error.error}`

                return throwError(err)
            })
        )
    }

    uploadGMT(customerId: string, excel: ParsedItem[]): Observable<GMTResponse> {
        const gmt_req = new GMTRequest()

        gmt_req.customerId = customerId
        gmt_req.gmt_array = new Array<GMTInfo>()

        for (const ex of excel) {
            const gmt_info = new GMTInfo()
            gmt_info.nrf = ex.gmt_color_code
            gmt_info.color = ex.gmt_color
            gmt_req.gmt_array.push(gmt_info)
            //console.log(iterator)    

        }

        //console.log(JSON.stringify(gmt_req))

        return this.http.post(gmtEP, gmt_req, {
            headers: this.getHeaders()
        }
        ).pipe(map(r => {
            const ret = (r as GMTResponse)
            return ret
        }
        )
        ).pipe(catchError((e: HttpErrorResponse) => {

            const err = new ServiceError()
            err.code = e.status
            err.message = `${e.error.error}`

            return throwError(err)
        }))
    }

    uploadRM(customerId: string, excel: ParsedItem[]): Observable<RMResponse> {
        const rmc_req = new RMRequest()

        rmc_req.customerId = customerId
        rmc_req.rm_array = new Array<RMInfo>()

        for (const ex of excel) {
            const rm_info = new RMInfo()

            rm_info.code = ex.rm_color_code.trim()
            rm_info.color = ex.rm_color.trim()
            rm_info.supplier = ex.rm_color_supplier.trim()

            rmc_req.rm_array.push(rm_info)

        }

        return this.http.post(rmcEP, rmc_req, {
            headers: this.getHeaders()
        }
        ).pipe(map(r => {
            const ret = (r as RMResponse)
            return ret
        }
        )
        ).pipe(catchError((e: HttpErrorResponse) => {

            const err = new ServiceError()
            err.code = e.status
            err.message = `${e.error.error}`

            return throwError(err)
        }))
    }

    addColorwaysToStyle(styleId: string, silhouette: string, gms: GMLibraryInfo[]): Observable<ColorWayToStyleResponse> {
        const req: ColorWayToStyleRequest = new ColorWayToStyleRequest()
        req.gmt_array = gms
        req.silhouette = silhouette
        return this.http.post(cwEP.replace('_s_id', styleId), req, {
            headers: this.getHeaders()
        }).pipe(map((r: any) => {
            const resp: ColorWayToStyleResponse = new ColorWayToStyleResponse()
            resp.added_colorways = r.color_ways
            return resp
        })
        ).pipe(catchError((e: HttpErrorResponse) => {
            const err = new ServiceError()
            err.code = e.status
            err.message = `${e.error.error}`

            return throwError(err)
        }))
    }

    addColorWaysToBOM(styleID: string, bomID: string, cway: ColorWayInfo[]): Observable<string[]> {
        const cw_ids = cway.map(c => c.id)
        return this.http.post(cwbEP.replace('_s_id', styleID).replace('_b_id', bomID), cw_ids, {
            headers: this.getHeaders()
        }).pipe(map(((r: any) => {
            const ret: string[] = r.color_vector

            return ret
        }))
        ).pipe(catchError((e: any) => {
            return throwError(e)
        }))
    }

    processRMGMWithReference(styleID: string, bomID: string, parsedExcelItems: ParsedItem[], rmItems: RMLibraryInfo[], colorWays: ColorWayInfo[]): Observable<ProcessRMGMREFResponse> {
        const req: ProcessRMGMREFRequest = new ProcessRMGMREFRequest()
        req.reference_array = parsedExcelItems
        req.color_ways = colorWays
        req.rm_colors = rmItems
        return this.http.post(prsEP.replace('_s_id', styleID).replace('_b_id', bomID), req, {
            headers: this.getHeaders()
        }).pipe(map((r: ProcessRMGMREFResponse) => {
            return r
        })
        ).pipe(catchError((e: HttpErrorResponse) => {
            const err = new ServiceError()
            err.code = e.status
            err.message = `${e.error.error}`

            return throwError(err)
        }))
    }

    finalMatch(styleID: string, bomID: string, processedrmgms: ProcessedRMGMREFElement[]): Observable<any> {
        console.log('Matching!')
        return this.http.post(matchEP.replace('_s_id', styleID).replace('_b_id', bomID), { rm_gm: processedrmgms }, {
            headers: this.getHeaders()
        })
            .pipe(map((r: any) => {
                return r
            }))
            .pipe(catchError((e: HttpErrorResponse) => {
                const err = new ServiceError()
                err.code = e.status
                err.message = `${e.error.error}`

                return throwError(err)
            }))
    }
}