export class CDTElement {
    id: number
    ldc_cdt : string
    plm_cdt : string
    state_cdt: boolean

}

export class CDTRequest {
    cdt_plm: string
    cdt_ldc: string
    cdt_act: boolean = true
}