export class SuccessSummary {
    colorways_extracted: number
    raw_material_extracted: number
    colorways_added_to_the_library: number
    raw_material_colors_added_to_the_library: number
    colorways_added_to_plm_bom: number
    raw_material_colors_added_to_plm_bom: number
}
export class ErrorInfo {
    error_type: string
    error_description: string
}
export class LDCLineInfo {
    reference_index: number
    rm_color: string
    rm_color_code: string
    rm_color_supplier: string
    rm_color_placement: string
    rm_color_cdt: string
    gmt_color: string
    gmt_color_code: string
}
export class HistoryRequest {
    customer_id_plm: string
    customer_name: string
    season_id_plm: string
    season_name: string
    style_id_plm: string
    style_name: string
    bom_version_id_plm: string
    bom_version_name: string
    success_summary: SuccessSummary
    errors: ErrorInfo[]
    details: LDCLineInfo[]
}

export class HistoryCustomerInfo {
    customer_id_plm: string
    customer_name: string
}
export class HistorySeasonInfo {
    season_id_plm: string
    season_name: string
}
export class HistoryStyleInfo {
    style_id_plm: string
    style_name: string
}
export class HistoryVersionInfo {
    bom_version_id_plm: string
    bom_version_name: string
}
export class HistoryUploadSlotInfo {
    id: number
    uploaded_date: Date
}
export class HistoryDetailsResponse {
    summary: SuccessSummary
    details: LDCLineInfo[]
    errors: ErrorInfo[]
}