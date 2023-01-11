export class RMInfo {
    color: string
    supplier: string
    code: string
}

export class RMRequest {
    customerId: string
    rm_array: Array<RMInfo>
}

export class RMSupplierInfo {
    id: string
    name: string
}

export class RMAddedInfo {
    color_id: string
    color_code: string
    color_name: string
    supplier: RMSupplierInfo
}

export class RMResponse {
    errors: string[]
    success: RMAddedInfo[]
    existed: RMAddedInfo[]
    totalErrors: number
    totalSuccess: number
    totalRM: number
}