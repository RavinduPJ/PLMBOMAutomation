import { RMLibraryInfo } from "src/app/modal/LibrayUploadModal";
import { ColorWayInfo } from "./add_colorway_to_style";
import { ParsedItem } from "./parse";

export class ProcessRMGMREFRequest {
    reference_array : ParsedItem[]
    rm_colors: RMLibraryInfo[]
    color_ways: ColorWayInfo[]
}

export class ProcessedRMGMREFElement {
    item_color_dying_technique_ldc: string
    item_color_dying_technique_plm: string
    item_gm_color_hide: string[]
    item_gm_color_name: string
    item_gm_color_nrf: string
    item_gm_colorway_id: string
    item_part_material_id: string
    item_placement: string
    item_rm_color_actual_material: string
    item_rm_color_code: string
    item_rm_color_material_id: string
    item_rm_color_name: string
    item_rm_color_spec_id: string
    item_rm_color_supplier_id: string
    item_rm_color_supplier_name: string
}
export class ProcessRMGMREFResponse {
    processed_info: ProcessedRMGMREFElement[]
    errors: string[]
}
