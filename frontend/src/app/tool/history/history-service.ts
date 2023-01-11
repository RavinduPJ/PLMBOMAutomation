import { HttpClient, HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { histEP } from "src/app/common/consts";
import { ServiceError } from "src/app/common/error";
import { HistoryCustomerInfo, HistoryDetailsResponse, HistoryRequest, HistorySeasonInfo, HistoryStyleInfo, HistoryUploadSlotInfo, HistoryVersionInfo, LDCLineInfo, SuccessSummary } from "../requestsresponses/history-rqrs";
import { ParsedItem } from "../requestsresponses/parse";

@Injectable()
export class HistoryService {

    private headers: HttpHeaders = new HttpHeaders({
        'Content-Type': 'application/json'
    })

    constructor(private http: HttpClient) {

    }

    saveHistory(
        customer_id_plm: string,
        customer_name: string,
        season_id_plm: string,
        season_name: string,
        style_id_plm: string,
        style_name: string,
        bom_version_id_plm: string,
        bom_version_name: string,
        colorways_extracted: number,
        raw_material_extracted: number,
        colorways_added_to_the_library: number,
        raw_material_colors_added_to_the_library: number,
        colorways_added_to_plm_bom: number,
        raw_material_colors_added_to_plm_bom: number,
        rm_errors: string[] = undefined,
        gmt_errors: string[] = undefined,
        final_rm_errors: string[] = undefined,
        final_gmt_errors: string[] = undefined,
        ldcDetails: ParsedItem[]
    ): Observable<void> {
        const rq: HistoryRequest = new HistoryRequest()
        rq.errors = undefined

        rq.customer_id_plm = customer_id_plm
        rq.customer_name = customer_name
        rq.season_id_plm = season_id_plm
        rq.season_name = season_name
        rq.style_id_plm = style_id_plm
        rq.style_name = style_name
        rq.bom_version_id_plm = bom_version_id_plm
        rq.bom_version_name = bom_version_name
        rq.success_summary = new SuccessSummary()
        rq.success_summary.colorways_extracted = colorways_extracted
        rq.success_summary.raw_material_extracted = raw_material_extracted
        rq.success_summary.colorways_added_to_the_library = colorways_added_to_the_library
        rq.success_summary.raw_material_colors_added_to_the_library = raw_material_colors_added_to_the_library
        rq.success_summary.colorways_added_to_plm_bom = colorways_added_to_plm_bom
        rq.success_summary.raw_material_colors_added_to_plm_bom = raw_material_colors_added_to_plm_bom

        function add_errors_internal(errorType: string, errors: string[]) {
            if (errors.length > 0) {
                if (rq.errors === undefined) {
                    rq.errors = []
                }
                for (const error of errors) {
                    rq.errors.push(
                        {
                            error_type: errorType.toUpperCase().trim(),
                            error_description: error
                        }
                    )
                }
            }
        }
        if (rm_errors !== undefined) {
            add_errors_internal('RM', rm_errors)
        }
        if (gmt_errors !== undefined) {
            add_errors_internal('GMT', gmt_errors)
        }
        if (final_rm_errors !== undefined) {
            add_errors_internal('RM', final_rm_errors)
        }
        if (final_gmt_errors !== undefined) {
            add_errors_internal('GMT', final_gmt_errors)
        }
        rq.details = ldcDetails.map(x => (x as LDCLineInfo))

        return this.http.post(histEP, rq, { headers: this.headers })
            .pipe(
                map(
                    () => {
                        return
                    }
                )
            ).pipe(
                catchError(
                    (e: HttpErrorResponse) => {
                        const err = new ServiceError()
                        err.code = e.status
                        err.message = `${e.error.error}`

                        return throwError(err)
                    }
                )
            )
    }

    getHistoryCustomers(): Observable<HistoryCustomerInfo[]> {
        return (this.http.get(`${histEP}/customers`, { headers: this.headers })
            .pipe(
                map(
                    (ret: HistoryCustomerInfo[]) => {
                        return [{ customer_id_plm: '-1', customer_name: '--Select--' }].concat(ret)
                    }
                )
            )
            .pipe(
                catchError(
                    (e: HttpErrorResponse) => {
                        const err = new ServiceError()
                        err.code = e.status
                        err.message = `${e.error.error}`

                        return throwError(err)
                    }
                )
            )
        )
    }

    getSeasonForCustomer(customerId: string): Observable<HistorySeasonInfo[]> {
        return (this.http.get(`${histEP}/customer/${customerId}/seasons`, { headers: this.headers })
            .pipe(
                map((r: HistorySeasonInfo[]) => {
                    return [{ season_id_plm: '-1', season_name: '--Select--' }].concat(r)
                })
            ).pipe(
                catchError(
                    (e: HttpErrorResponse) => {
                        const err = new ServiceError()
                        err.code = e.status
                        err.message = `${e.error.error}`

                        return throwError(err)
                    }
                )
            )
        )
    }

    getStyleForSeason(customerId: string, seasonId: string): Observable<HistoryStyleInfo[]> {
        return (this.http.get(`${histEP}/customer/${customerId}/season/${seasonId}/styles`, { headers: this.headers })
            .pipe(
                map(
                    (r: HistoryStyleInfo[]) => {
                        return [{ style_id_plm: '-1', style_name: '--Select--' }].concat(r)
                    }
                )
            )
            .pipe(
                catchError(
                    (e: HttpErrorResponse) => {
                        const err = new ServiceError()
                        err.code = e.status
                        err.message = `${e.error.error}`

                        return throwError(err)
                    }
                )
            )
        )
    }

    getVersionForStyle(customerId: string, seasonId: string, styleId: string): Observable<HistoryVersionInfo[]> {
        return (this.http.get(`${histEP}/customer/${customerId}/season/${seasonId}/style/${styleId}/boms`, { headers: this.headers })
            .pipe(
                map((r: HistoryVersionInfo[]) => {
                    return [{ bom_version_id_plm: '-1', bom_version_name: '--Select--' }].concat(r)
                })
            )
            .pipe(
                catchError(
                    (e: HttpErrorResponse) => {
                        const err = new ServiceError()
                        err.code = e.status
                        err.message = `${e.error.error}`

                        return throwError(err)
                    }
                )
            )
        )
    }

    getUploadSlotForVersion(customerId: string, seasonId: string, styleId: string, version: string): Observable<HistoryUploadSlotInfo[]> {
        return (this.http.get(`${histEP}/customer/${customerId}/season/${seasonId}/style/${styleId}/bom/${version}/upload_slots`, { headers: this.headers })
            .pipe(
                map((r: HistoryUploadSlotInfo[]) => {
                    return [{ id: -1, uploaded_date: undefined }].concat(r)
                })
            )
            .pipe(
                catchError(
                    (e: HttpErrorResponse) => {
                        const err = new ServiceError()
                        err.code = e.status
                        err.message = `${e.error.error}`

                        return throwError(err)
                    }
                )
            )
        )
    }

    getDetailsFromUploadSlot(customerId: string, seasonId: string, styleId: string, version: string, uploadSlot: number): Observable<HistoryDetailsResponse> {
        return (this.http.get(`${histEP}/customer/${customerId}/season/${seasonId}/style/${styleId}/bom/${version}/upload_slot/${uploadSlot}/details`, {headers:this.headers})
            .pipe(
                map((r: HistoryDetailsResponse) => {
                    return r
                })
            )
            .pipe(
                catchError(
                    (e: HttpErrorResponse) => {
                        const err = new ServiceError()
                        err.code = e.status
                        err.message = `${e.error.error}`

                        return throwError(err)
                    }
                )
            )
        )
    }
}