export class Customer {
    id: string
    name: string
}
export class Season {
    id: string
    name: string
    year: string
    season: string
}
export class Style {
    id: string
    name: string
}
export class BOM{
    id: string
    name: string
    description: string
    version: string
    versions: string[]
}

export class CustomerResponseModal {
    customers : Customer[]
    length(){
        return this.customers.length
    }
}
export class SeasonResponseModal {
    seasons: Season[]
    length(){
        return this.seasons.length
    }
}
export class StyleResponseModal {
    styles: Style[]
    length(){
        return this.styles.length
    }
}
export class BOMResponseModal {
    boms: BOM[]
    length(){
        return this.boms.length
    }
}
export class Silhouette {
    id: string
    name: string
}