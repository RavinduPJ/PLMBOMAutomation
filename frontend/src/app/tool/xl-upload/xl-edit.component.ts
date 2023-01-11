import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ExcelModal } from "../../modal/ExcelModal";
import { ParsedItem } from "../requestsresponses/parse";

@Component({
    selector: 'edit-box',
    templateUrl: './xl-edit.component.html',
    styleUrls: ['./xl-edit.component.css']
})
export class ExcelEditComponent implements OnInit {
    @Input() editRow: ParsedItem
    @Output() buttonFire: EventEmitter<ParsedItem | void> = new EventEmitter()

    editForm: FormGroup

   
    gmtColor: FormControl
    gmtColorCode: FormControl
    rmColor: FormControl
    rmColorCode: FormControl
    placementName: FormControl
    supplierName: FormControl
    colorDyingTechnique: FormControl

    ngOnInit(): void {
        console.log(this.editRow)
        this.gmtColor = new FormControl(this.editRow.gmt_color, Validators.required)
        this.gmtColorCode = new FormControl(this.editRow.gmt_color_code, Validators.required)
        this.rmColor = new FormControl(this.editRow.rm_color, Validators.required)
        this.rmColorCode = new FormControl(this.editRow.rm_color_code, Validators.required)
        this.placementName = new FormControl(this.editRow.rm_color_placement, Validators.required)
        this.supplierName = new FormControl(this.editRow.rm_color_supplier, Validators.required)
        this.colorDyingTechnique = new FormControl(this.editRow.rm_color_cdt, Validators.required)

        this.editForm = new FormGroup({
            gmtColor: this.gmtColor,
            gmtColorCode: this.gmtColorCode,
            rmColor: this.rmColor,
            rmColorCode: this.rmColorCode,
            placementName: this.placementName,
            supplierName: this.supplierName,
            colorDyingTechnique: this.colorDyingTechnique
        })
    }

    save(edited){
        
        this.editRow.gmt_color = edited.gmtColor
        this.editRow.gmt_color_code = edited.gmtColorCode
        this.editRow.rm_color = edited.rmColor
        this.editRow.rm_color_placement = edited.placementName
        this.editRow.rm_color_supplier = edited.supplierName
        this.editRow.rm_color_cdt = edited.colorDyingTechnique
        this.buttonFire.emit(this.editRow)

    }

    cancel(){
        this.buttonFire.emit()
    }
}