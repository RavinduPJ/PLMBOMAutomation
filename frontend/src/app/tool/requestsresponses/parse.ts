export class ParseRequest {
    parse_data: ParseItem[]
}

export class ParseResponse {
    parsed_data: ParsedItem[]
}

export class ParseItem {
    rm_color: string
    rm_color_code: string
    rm_color_supplier: string
    rm_color_placement: string
    rm_color_cdt: string
    gmt_color: string
    gmt_color_code: string
}

export class ParsedItem {
    reference_index: number
    rm_color: string
    rm_color_code: string
    rm_color_supplier: string
    rm_color_placement: string
    rm_color_cdt: string
    gmt_color: string
    gmt_color_code: string
}