export  class Consts {
    //private static baseURL: string = "http://host1.shadowpeg.com:12300"
    private static baseURL: string = "http://localhost:8780"
    private static version: string = ""
    private static apiURL: string = `${Consts.baseURL}/api`

    static loginAPI: string = `${Consts.apiURL}/login`

    static customerEP: string = `${Consts.apiURL}/master/customers`
    static seasonEP: string = `${Consts.apiURL}/master/customer/_s_id/seasons`
    static styleEP: string = `${Consts.apiURL}/master/season/_s_id/styles`
    static bomEP: string = `${Consts.apiURL}/master/style/_s_id/bom`
    static silhouetteEP: string = `${Consts.apiURL}/master/silhouettes`

    static parseEP: string = `${Consts.apiURL}/parse`

    static gmtEP: string = `${Consts.apiURL}/color/gmt`
    static rmcEp: string = `${Consts.apiURL}/color/rm`

    static cwEP: string = `${Consts.apiURL}/bom/colorways/_s_id`
    static cwbEP: string = `${Consts.apiURL}/bom/_s_id/_b_id/gmt`

    static prsEP: string = `${Consts.apiURL}/bom/_s_id/_b_id/rm/material`

    static matchEP: string = `${Consts.apiURL}/bom/_s_id/_b_id/match`


    static userEP: string = `${Consts.apiURL}/user`

    static roleEP: string = `${Consts.apiURL}/roles`

    static cdtEP: string = `${Consts.apiURL}/cdt`

    static histEP: string = `${Consts.apiURL}/history`
}

export class CommonRequest {
    cookie: string
}



export const loginAPI: string = Consts.loginAPI

export const customerEP: string = Consts.customerEP
export const seasonEP: string = Consts.seasonEP
export const styleEP: string = Consts.styleEP
export const bomEP: string = Consts.bomEP
export const silhouetteEP: string = Consts.silhouetteEP

export const parseEP: string = Consts.parseEP

export const gmtEP: string = Consts.gmtEP
export const rmcEP: string = Consts.rmcEp

export const cwEP : string = Consts.cwEP
export const cwbEP : string = Consts.cwbEP

export const prsEP: string = Consts.prsEP

export const matchEP: string = Consts.matchEP


export const userEP: string = Consts.userEP

export const roleEP: string = Consts.roleEP

export const cdtEP: string = Consts.cdtEP

export const histEP: string = Consts.histEP
