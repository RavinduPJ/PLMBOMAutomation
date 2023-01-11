export class ColorWayToStyleRequest {
    silhouette: string
    gmt_array: GMTItemInfo[]
}

export class ColorWayToStyleResponse {
    added_colorways: ColorWayInfo[]
}

export class GMTItemInfo {
    color_code: string
    color_name: string
}


export class ColorWayInfo {
    id: string
    name: string
}