import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { CDTElement } from "./cdt-rqrs";
import { CDTService } from "./cdt-service";

@Component({
    selector: 'cdt',
    templateUrl: 'cdt-mnagement-component.html',
    styleUrls: ['cdt-mnagement-component.scss']
})

export class CDTManagementComponent implements OnInit {
    cdt: FormGroup
    roller: boolean = false

    editing: boolean = false

    cdt_ldc: FormControl
    cdt_plm: FormControl

    cdts: CDTElement[] = []

    error: string = ''

    editing_id: number = undefined

    constructor(private cds: CDTService) {
        this.cdt_ldc = new FormControl('', Validators.required)
        this.cdt_plm = new FormControl('', Validators.required)

        this.cdt = new FormGroup({
            cdt_ldc: this.cdt_ldc,
            cdt_plm: this.cdt_plm
        })
    }

    ngOnInit(): void {
        this.refresh()
    }

    refresh() {
        this.editing_id = 0
        this.editing = false
        this.error = ''
       
        this.cds.existingCDT().subscribe(
            res => {
                this.cdts = []
                this.cdts = res
            },
            () => {
                this.error = 'Unable to get existing color dying technique mappings!'
            }
        )
    }


    doSave() {
        this.error = ''
        this.roller = true
        if (!this.cdt.valid) {
            if (this.cdt_ldc.invalid) {
                this.error = 'Please enter the Lab Dip Chart\'s color dying technique string!'
            } else if (this.cdt_plm.invalid) {
                this.error = 'Please enter the PLM\'s color dying technique string!'
            }
            this.roller = false
        } else {
            if (!this.editing) {
                this.cds.addCDT(this.cdt_ldc.value, this.cdt_plm.value)
                    .subscribe(
                        () => {
                            this.error = ''
                            this.cdt_ldc.setValue('')
                            this.cdt_plm.setValue('')
                            this.roller = false
                            this.refresh()
                        },
                        (e) => {
                            this.error = e.message
                            this.roller = false
                        }
                    )
            } else {
                this.cds.updateCDT(this.editing_id, this.cdt_ldc.value, this.cdt_plm.value)
                    .subscribe(
                        () => {
                            this.editing = false
                            this.editing_id = undefined
                            this.roller = false
                            this.error = ''
                            this.cdt_ldc.setValue('')
                            this.cdt_plm.setValue('')
                            this.roller = false
                            this.refresh()
                        },
                        (e) => {
                            this.editing = false
                            this.editing_id = undefined
                            this.roller = false
                            this.error = `An error occurred when updating colordying technique mapping! Error: ${e.message}`
                            this.roller = false
                        }
                    )
            }
        }
    }

    tgl(id, elm: HTMLElement) {
        const newState: boolean = !elm.classList.contains('fa-toggle-on')
        this.roller = true
        this.cds.setActiveState(id, newState)
            .subscribe(
                () => {
                    this.roller = false
                    this.refresh()
                },
                (error) => {
                    this.roller = false
                    this.error = ('Unable to change the active state!')
                }
            )
    }

    edt(id, ldc: HTMLElement, plm: HTMLElement) {
        const _ldc = ldc.innerText.trim()
        const _plm = plm.innerText.trim()
        this.editing_id = id
        this.editing = true

        this.cdt_ldc.setValue(_ldc)
        this.cdt_plm.setValue(_plm)

    }

    del(id) {
        this.cds.deleteCDT(id)
            .subscribe(
                () => {
                    this.refresh()
                },
                (e) => {
                    this.error = ' Unable to delete color dyeing technique mapping!'
                }
            )
    }
}