export class SupplierPerRM {
    supplierName: string
    rms: number
}

export class GMLibraryInfo {
    color_code: string
    color_name: string
}



export class RMLibraryInfo {
    color_id: string
    color_name: string
    color_code: string
    supplier : {
        id: string
        name: string
    }
}

export class LibraryUploadModal {
    gmtErrors: string[]
    rmErrors: string[]
    totalGMTExtracted: number
    totalRMExtracted: number
    totalGMTAdded: number
    totalRMAdded: number
    gmInLibrary : GMLibraryInfo[]
    rmInLibrary : RMLibraryInfo[]
    perInfo() : SupplierPerRM[] {
        const ret: SupplierPerRM[] = []
        for (const rm of this.rmInLibrary) {
            let rm_in_ret = false
            for (const exrm of ret) {
                if(exrm.supplierName.toLocaleLowerCase().trim() === rm.supplier.name.toLocaleLowerCase().trim()){
                    exrm.rms++
                    rm_in_ret = true
                    break
                }
            }
            if(!rm_in_ret){
                ret.push({
                    supplierName: rm.supplier.name,
                    rms: 1
                })
            }
        }

    

        return ret
    }
}