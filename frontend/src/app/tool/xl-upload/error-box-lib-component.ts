import { Component, Input, Output, EventEmitter } from "@angular/core";
import * as XLSX from 'xlsx'


@Component({
    selector: 'error-box-lib',
    templateUrl: './error-box-lib-component.html',
    styleUrls: ['./error-box-lib-component.css']
})

export class ErrorBoxLibraryComponent {
    //@Output()
    @Input() gmte: string[]
    @Input() rmce: string[]
    @Input() genericErrors: string[]
    @Output() closeEvt: EventEmitter<void> = new EventEmitter()

    srm: boolean = false
    sgmt: boolean = false
    sf: boolean = false

    

    close() {
        this.closeEvt.emit()
    }

    dload() {
        let excelFile = ''
        let ws: XLSX.WorkSheet
        const jsn = []
        


        if (this.genericErrors) {
            excelFile = 'bom-errors.xlsx'
            for (const err of this.genericErrors) {
                jsn.push(
                    {
                        bom_related_error: err
                    }
                )
            }

            

        } else {
            
            const len = this.gmte.length > this.rmce.length ? this.gmte.length : this.rmce.length

            for (let index = 0; index < len; index++) {
                const ge = index < this.gmte.length  ? this.gmte[index] : ""
                const re = index < this.rmce.length  ? this.rmce[index] : ""

                jsn.push({
                    gm_error: ge,
                    rm_error: re
                })
            }

            excelFile = 'library-errors.xlsx'            
            
            
        }

        ws = XLSX.utils.json_to_sheet(jsn)
        const wb: XLSX.WorkBook = XLSX.utils.book_new()

        if(this.genericErrors){
            XLSX.utils.sheet_add_aoa(ws, [["BOM Errors"]], {origin:"A1"})
            XLSX.utils.book_append_sheet(wb, ws, 'BOM Creation Errors')
        }else{
            XLSX.utils.sheet_add_aoa(ws, [["GMT Errors", "RM Errors"]], {origin:"A1"})
            XLSX.utils.book_append_sheet(wb, ws, 'Library Errors')
        }

        
        

        XLSX.writeFile(wb, excelFile)

    }

    showGMT(){
        this.sgmt = !this.sgmt
    }

    showRM(){
        this.srm = !this.srm
    }

    showEF(){
        this.sf = !this.sf
    }
}