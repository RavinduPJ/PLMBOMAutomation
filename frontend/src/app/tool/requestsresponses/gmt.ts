export class GMTInfo {
    color: string
    nrf: string
}

export class GMTRequest {
    customerId: string
    gmt_array: Array<GMTInfo>
}

export class GMTAddedInfo {
    color_code: string
    color_name: string
}
export class GMTResponse {
    errors: string[]
    successes: GMTAddedInfo[]
    existed: GMTAddedInfo[]
    totalErrors: number
    totalGMT: number
    totalSuccess: number
}