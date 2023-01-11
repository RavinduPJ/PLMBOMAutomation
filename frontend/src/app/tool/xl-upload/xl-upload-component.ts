import { Component, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { CookieService } from "ngx-cookie-service";
import { combineLatest, forkJoin, Observable, of } from "rxjs";
import { catchError, startWith, map, } from "rxjs/operators";
import { ServiceError } from "src/app/common/error";

import { ExcelModal } from "src/app/modal/ExcelModal";
import { GMLibraryInfo, LibraryUploadModal, RMLibraryInfo } from "src/app/modal/LibrayUploadModal";
import * as XLSX from 'xlsx'
import { HistoryService } from "../history/history-service";
import { ColorWayInfo } from "../requestsresponses/add_colorway_to_style";
import { GMTResponse } from "../requestsresponses/gmt";
import { ParsedItem, ParseItem, ParseRequest, ParseResponse } from "../requestsresponses/parse";
import { ProcessedRMGMREFElement } from "../requestsresponses/process_rm_gm_ref";
import { RMResponse } from "../requestsresponses/rmc";
import { BOMService } from "./bom-service";
import { BOM, Customer, Season, Silhouette, Style } from "./master-data-modal";
import { MasterDataService } from "./master-data-service";
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'xl',
    templateUrl: './xl-upload-component.html',
    styleUrls: ['./xl-upload-component.scss']
})

export class XLUploadComponent implements OnInit {
    customers: Customer[] = []
    silhouettes: Silhouette[] = []
    styles: Style[] = []
    seasons: Season[] = []
    versions: BOM[] = []

    filteredCustomers: Observable<string[]>
    filteredStyles: Observable<string[]>
    filteredSeasons: Observable<string[]>
    filteredVersions: Observable<string[]>
    filteredSilhouettes: Observable<string[]>


    selectedCustomer: string = undefined
    selectedStyle: string = undefined
    selectedSeason: string = undefined
    selectedVersion: string = undefined
    selectedSilhouette: string = undefined

    customerControl = new FormControl('')
    seasonControl = new FormControl('')
    styleNumberControl = new FormControl('')
    bomVersionControl = new FormControl('')
    silhouteControl = new FormControl('')





    loading: boolean = false

    masterDataOK: boolean = false


    //excel related data
    excelData: ExcelModal[] = []

    //excel parsed data -> This is the one we are using
    parsedExcel: ParseResponse


    editMode: boolean
    editingRow: ParsedItem

    tableData: ParsedItem[]

    perTablePage: number = 10
    tablePageNo: number = 1

    backButtonDisabled: boolean = false
    forwardButtonDisabled: boolean = false

    tablePagenation: boolean = false


    libraryUploadStatus: LibraryUploadModal = new LibraryUploadModal()
    colorWays: ColorWayInfo[]
    colorVector: string[]
    rmMaterials: ProcessedRMGMREFElement[]



    excelOk: boolean = false

    libraryUploadErrors: boolean = false

    dispFinalErrors: boolean = false

    finalRMErrors: string[]

    page: number;
    showLibErrors: boolean = false

    loader: boolean = false

    showSuppPer: boolean = false

    constructor(private mds: MasterDataService, private bom: BOMService, private cs: CookieService, private hs: HistoryService, private toastr: ToastrService) {
        this.libraryUploadStatus.gmtErrors = []
        this.libraryUploadStatus.rmErrors = []
        this.libraryUploadStatus.gmInLibrary = []
        this.libraryUploadStatus.rmInLibrary = []
        this.finalRMErrors = []

        this.seasonControl.disable()
        this.styleNumberControl.disable()
        this.bomVersionControl.disable()
        this.silhouteControl.disable()


    }


    loadCustomers() {
        const uid = this.cs.get('uid')
        this.loading = true

        this.mds.customers(parseInt(uid)).subscribe(
            ok => {

                this.customers = ok.customers
                this.filteredCustomers = this.customerControl.valueChanges
                    .pipe(
                        startWith(''),
                        map(val => this._filter(val || '', this.customers))
                    )
                this.loading = false
            },
            err => {
                this.customers = [{ id: "-1", name: "No customers or no valid customers" }]
                this.loading = false
            },
            () => {

            }
        )
    }
    loadSilhouettes() {
        this.loading = true
        this.mds.silhouette().subscribe(
            s => {
                this.silhouettes = s
                this.loading = false
                this.silhouteControl.enable()
                this.filteredSilhouettes = this.silhouteControl.valueChanges
                    .pipe(
                        startWith(''),
                        map(val => this._filter(val || '', this.silhouettes))
                    )
            },
            e => {
                this.silhouteControl.enable()
                this.silhouettes = [{ id: "-1", name: "No silhouettes or no valid silhouettes" }]
                this.loading = false
            },
            () => {

            }
        )
    }
    customerSelected(customer: string) {

        this.seasons = []
        this.styles = []
        this.versions = []
        this.silhouettes = []

        this.seasonControl.disable()
        this.styleNumberControl.disable()
        this.bomVersionControl.disable()
        this.silhouteControl.disable()


        this.seasonControl.setValue('')
        this.styleNumberControl.setValue('')
        this.bomVersionControl.setValue('')
        this.silhouteControl.setValue('')


        this.selectedCustomer = undefined
        this.selectedSeason = undefined
        this.selectedStyle = undefined
        this.selectedVersion = undefined
        this.selectedSilhouette = undefined

        this.masterDataOK = false





        if (!customer) {
            return
        }

        if (customer.toLowerCase().startsWith('no')) {
            return
        }

        const _selected = this.customers.find(c => c.name.trim() === customer.trim())

        if (!_selected) {
            return
        }






        this.selectedCustomer = _selected.id
        this.loading = true


        this.mds.seasons(this.selectedCustomer).subscribe(
            ok => {

                this.seasons = ok.seasons
                this.loading = false
                this.seasonControl.enable()
                this.filteredSeasons = this.seasonControl.valueChanges
                    .pipe(
                        startWith(''),
                        map(val => this._filter(val || '', this.seasons))
                    )
            },
            err => {
                this.seasonControl.enable()
                this.seasons = [{ id: "-1", name: "No Seasons", year: "", season: "" }]
                this.loading = false
            },
            () => {

            }
        )
    }
    seasonSelected(season: string) {
        this.styles = []
        this.versions = []
        this.silhouettes = []

        this.selectedSeason = undefined
        this.selectedStyle = undefined
        this.selectedVersion = undefined
        this.selectedSilhouette = undefined

        this.styleNumberControl.disable()
        this.bomVersionControl.disable()
        this.silhouteControl.disable()

        this.styleNumberControl.setValue('')
        this.bomVersionControl.setValue('')
        this.silhouteControl.setValue('')

        this.masterDataOK = false
        if (!season) {
            return
        }

        if (season.toLowerCase().startsWith('no')) {
            return
        }

        const _selected = this.seasons.find(s => s.name.trim() === season.trim())

        if (!_selected) {
            return
        }

        this.selectedSeason = _selected.id
        this.loading = true
        this.mds.styles(this.selectedSeason)
            .subscribe(
                ok => {

                    this.styles = ok.styles
                    this.loading = false
                    this.styleNumberControl.enable()
                    this.filteredStyles = this.styleNumberControl.valueChanges
                        .pipe(
                            startWith(''),
                            map(val => this._filter(val || '', this.styles))
                        )
                },
                err => {
                    this.styleNumberControl.enable()
                    this.styles = [{ id: "-1", name: "No Styles" }]
                    this.loading = false
                },
                () => {

                }
            )
    }
    styleSelected(style) {
        this.versions = []
        this.silhouettes = []

        this.selectedStyle = undefined
        this.selectedVersion = undefined
        this.selectedSilhouette = undefined

        this.bomVersionControl.disable()
        this.silhouteControl.disable()

        this.bomVersionControl.setValue('')
        this.silhouteControl.setValue('')

        this.masterDataOK = false
        if (!style) {
            return
        }

        if (style.toLowerCase().startsWith('no')) {
            return
        }

        const _selected = this.styles.find(s => s.name.trim() === style.trim())

        if (!_selected) {
            return
        }
        this.selectedStyle = _selected.id
        this.loading = true
        this.mds.boms(this.selectedStyle)
            .subscribe(
                ok => {

                    this.versions = ok.boms
                    this.loading = false
                    this.bomVersionControl.enable()
                    this.filteredVersions = this.bomVersionControl.valueChanges
                        .pipe(
                            startWith(''),
                            map(val => this._filter(val || '', this.versions))
                        )

                },
                err => {
                    this.bomVersionControl.enable()
                    this.versions = [{ id: "-1", name: "No BOMs", description: "", version: "", versions: [] }]
                    this.loading = false
                    this.filteredVersions = this.bomVersionControl.valueChanges
                        .pipe(
                            startWith(''),
                            map(val => this._filter(val || '', this.versions))
                        )
                },
                () => {

                }
            )
    }
    bomSelected(bom: string) {
        this.silhouettes = []

        this.selectedVersion = undefined
        this.selectedSilhouette = undefined

        this.silhouteControl.disable()

        this.silhouteControl.setValue('')


        this.masterDataOK = false
        if (!bom) {
            return
        }
        if (bom.toLowerCase().startsWith('no')) {
            return
        }

        const _selected = this.versions.find(s => s.name.trim() === bom.trim())

        if (!_selected) {
            return
        }

        this.selectedVersion = _selected.id

        this.loadSilhouettes()

    }

    silhouetteSelected(silhouette) {
        this.selectedSilhouette = undefined

        this.masterDataOK = false
        if (silhouette.toLowerCase().startsWith('no')) {
            return
        }

        if (!silhouette) {
            return
        }

        const _selected = this.silhouettes.find(s => s.name.trim() === silhouette.trim())

        if (!_selected) {
            return
        }

        this.selectedSilhouette = _selected.id
        this.masterDataOK = true
    }

    ngOnInit(): void {



        this.loadCustomers()





        this.page = 1






        this.customerControl.valueChanges

            .subscribe(
                (s: string) => {
                    this.customerSelected(s)
                }
            )
        this.seasonControl.valueChanges.subscribe(
            (s: string) => {
                this.seasonSelected(s)
            }
        )
        this.styleNumberControl.valueChanges.subscribe(
            (s: string) => {
                this.styleSelected(s)
            }
        )
        this.bomVersionControl.valueChanges.subscribe(
            (s: string) => {
                this.bomSelected(s)
            }
        )
        this.silhouteControl.valueChanges.subscribe(
            (s: string) => {
                this.silhouetteSelected(s)
            }
        )
    }

    private _filter(value: string, baseArray: { id: string, name: string }[]): string[] {

        const filterValue = value.toLowerCase()
        const r = baseArray.filter(option => option.name.toLowerCase().includes(filterValue)).map(x => x.name)
        return r
    }


    processUpload() {
        const parseRq: ParseRequest = new ParseRequest()
        parseRq.parse_data = []
        this.loader = true


        for (const exlItem of this.excelData
        ) {
            const parse_elm = new ParseItem()
            parse_elm.rm_color = exlItem.rmColor
            parse_elm.rm_color_cdt = exlItem.colorDyingTechnique
            parse_elm.rm_color_code = exlItem.colorCode
            parse_elm.rm_color_placement = exlItem.placementName
            parse_elm.rm_color_supplier = exlItem.supplierName

            parse_elm.gmt_color = exlItem.gmtColor
            parse_elm.gmt_color_code = exlItem.nrf

            parseRq.parse_data.push(parse_elm)
        }

        this.bom.parseExcel(parseRq).subscribe(
            (s) => {
                this.parsedExcel = s
                this.loader = false
            },
            (e) => {

            },
            () => {
                this.page = 2
                this.tablePagenation = this.parsedExcel.parsed_data.length > this.perTablePage



                this.refreshTable()

            }
        )


    }

    refreshTable() {
        const tablePageIndex = this.tablePageNo - 1
        const totalTablePages = Math.trunc(this.parsedExcel.parsed_data.length / this.perTablePage)
        this.tableData = this.parsedExcel.parsed_data.slice(tablePageIndex * this.perTablePage, (tablePageIndex * this.perTablePage) + this.perTablePage)
        if (tablePageIndex == 0) {
            this.backButtonDisabled = true
        } else if (tablePageIndex > 0) {
            this.backButtonDisabled = false
        }

        if (tablePageIndex == totalTablePages) {
            this.forwardButtonDisabled = true
        } else if (tablePageIndex < totalTablePages) {
            this.forwardButtonDisabled = false
        }
    }

    doUploadToLibrary() {
        this.loader = true
        forkJoin([this.bom.uploadGMT(this.selectedCustomer, this.parsedExcel.parsed_data)
            .pipe(catchError((err: ServiceError) => of(err))),
        this.bom.uploadRM(this.selectedCustomer, this.parsedExcel.parsed_data)
            .pipe(catchError((err: ServiceError) => of(err)))
        ])
            .subscribe(
                ([gmt, rm]) => {
                    if (gmt instanceof ServiceError) {
                        const e = gmt as ServiceError
                        this.libraryUploadStatus.gmtErrors.push(e.message)
                    } else {
                        const gmr = gmt as GMTResponse
                        this.libraryUploadStatus.totalGMTExtracted = gmr.totalGMT
                        this.libraryUploadStatus.totalGMTAdded = gmr.totalSuccess
                        const added = (gmt.successes as GMLibraryInfo[])
                        const existed = (gmt.existed as GMLibraryInfo[])
                        const total = added.concat(existed)
                        this.libraryUploadStatus.gmInLibrary = total



                        for (const err of gmr.errors) {
                            this.libraryUploadStatus.gmtErrors.push(err)
                        }
                    }

                    if (rm instanceof ServiceError) {
                        const e = rm as ServiceError
                        this.libraryUploadStatus.rmErrors.push(e.message)
                    } else {
                        const rmr = rm as RMResponse
                        this.libraryUploadStatus.totalRMExtracted = rmr.totalRM
                        this.libraryUploadStatus.totalRMAdded = rmr.totalSuccess
                        const added = rm.success as RMLibraryInfo[]
                        const existed = rm.existed as RMLibraryInfo[]
                        const total = added.concat(existed)
                        this.libraryUploadStatus.rmInLibrary = total

                        for (const err of rmr.errors) {
                            this.libraryUploadStatus.rmErrors.push(err)
                        }
                    }

                    this.nxp()

                }


            )



    }

    nxp() {
        this.loader = false
        if (this.libraryUploadStatus.gmtErrors.length > 0 || this.libraryUploadStatus.rmErrors.length > 0) {
            this.libraryUploadErrors = true
        }


        this.page = 3;

    }

    doFinalUpload() {
        this.loader = true
        //1. Add colorways to the style
        this.bom.addColorwaysToStyle(this.selectedStyle, (() => {
            for (const silhouette of this.silhouettes) {
                if (silhouette.id.trim().toLocaleLowerCase() === this.selectedSilhouette.toLocaleLowerCase().trim()) {
                    return silhouette.name.trim()
                }
            }
            return 'Hipster'
        })(), this.libraryUploadStatus.gmInLibrary)
            .subscribe(
                (success) => {
                    this.colorWays = success.added_colorways
                    //2. Add colorways to BOM
                    this.bom.addColorWaysToBOM(this.selectedStyle, this.selectedVersion, this.colorWays)
                        .subscribe(
                            (success) => {
                                this.colorVector = success

                                //3. Process RM, GM with Reference Array
                                this.bom.processRMGMWithReference(this.selectedStyle, this.selectedVersion, this.parsedExcel.parsed_data, this.libraryUploadStatus.rmInLibrary, this.colorWays)
                                    .subscribe(
                                        (success) => {
                                            if (success.errors && success.errors.length > 0) {
                                                this.finalRMErrors = success.errors
                                            }
                                            if (success.processed_info.length > 0) {
                                                this.rmMaterials = success.processed_info

                                                //4. Final Match!
                                                this.bom.finalMatch(this.selectedStyle, this.selectedVersion, this.rmMaterials)
                                                    .subscribe(
                                                        (s) => {
                                                            this.saveHistory().subscribe(
                                                                () => {
                                                                    this.loader = false

                                                                    this.page = 4
                                                                },
                                                                (err) => {
                                                                    alert(err)
                                                                    console.error(err)
                                                                }
                                                            )


                                                        },
                                                        (e: ServiceError) => {
                                                            this.loader = false
                                                            alert(e.message)
                                                            console.error(e)
                                                        },
                                                        () => {

                                                        }

                                                    )
                                            } else {
                                                //no more RMs to add to materials!
                                                this.rmMaterials = []
                                                this.finalRMErrors.push('This BOM does not have matching placements for RM materials!')
                                                this.saveHistory().subscribe(
                                                    () => {
                                                        this.loader = false

                                                        this.page = 4
                                                    },
                                                    (err) => {
                                                        alert(err)
                                                        console.error(err)
                                                    }
                                                )
                                            }
                                        },
                                        (err: ServiceError) => {
                                            alert(err.message)
                                            console.error(err)

                                        },
                                        () => {

                                        }
                                    )

                            },
                            (err: ServiceError) => {
                                alert(err.message)
                                console.error(err)
                            },
                            () => {

                            }
                        )
                },
                (error) => {
                    alert(`Error occurred on adding colorways to style! ${error.message}`)
                },
                () => {

                }
            )

        //
    }

    showErrors() {
        this.showLibErrors = true
    }
    hideErrors() {
        this.showLibErrors = false
    }

    showErrorsOnFinal() {
        this.dispFinalErrors = true
    }
    hideErrorsOnFinal() {
        this.dispFinalErrors = false
    }

    tablePageBack() {
        this.tablePageNo--
        this.refreshTable()
    }

    tablePageForward() {
        this.tablePageNo++
        this.refreshTable()
    }

    editRow(idx: number) {
        const row = ((this.tablePageNo - 1) * this.perTablePage) + idx
        this.editMode = true
        this.editingRow = this.parsedExcel.parsed_data[row]


    }

    editCallback(eventInfo) {
        this.editingRow = undefined
        this.editMode = false
    }


    reset() {
        this.tablePageNo = 1
        this.excelData = []
        this.tableData = []
        this.backButtonDisabled = false
        this.forwardButtonDisabled = false
        this.tablePagenation = false
        this.excelOk = false
        this.page = 1

        this.customers = []
        this.styles = []
        this.seasons = []
        this.versions = []

        this.libraryUploadStatus.gmtErrors = []
        this.libraryUploadStatus.rmErrors = []
        this.libraryUploadStatus.totalGMTAdded = 0
        this.libraryUploadStatus.totalRMAdded = 0
        this.libraryUploadStatus.totalGMTExtracted = 0
        this.libraryUploadStatus.totalRMExtracted = 0
        this.finalRMErrors = []

        this.selectedCustomer = undefined
        this.selectedStyle = undefined
        this.selectedSeason = undefined
        this.selectedVersion = undefined
        this.selectedSilhouette = undefined

        this.masterDataOK = false

        this.loading = false

        this.customerControl.setValue('')
        this.seasonControl.setValue('')
        this.styleNumberControl.setValue('')
        this.bomVersionControl.setValue('')
        this.silhouteControl.setValue('')

        this.seasonControl.disable()
        this.styleNumberControl.disable()
        this.bomVersionControl.disable()
        this.silhouteControl.disable()

        this.loadCustomers()


    }
    private saveHistory(): Observable<void> {
        function valueFromId(array: { id: string, name: string }[], searchId: string): string {
            for (const elm of array) {
                if (elm.id.trim().toLocaleLowerCase() === searchId.trim().toLocaleLowerCase()) {
                    return elm.name.trim()
                }
            }
            return undefined
        }
        return this.hs.saveHistory(
            this.selectedCustomer,
            valueFromId(this.customers, this.selectedCustomer)
            ,
            this.selectedSeason,
            valueFromId(this.seasons, this.selectedSeason)
            ,
            this.selectedStyle,
            valueFromId(this.styles, this.selectedStyle)
            ,
            this.selectedVersion,
            valueFromId(this.versions, this.selectedVersion),
            this.libraryUploadStatus.gmInLibrary.length,
            this.libraryUploadStatus.rmInLibrary.length,
            this.libraryUploadStatus.gmInLibrary.length,
            this.libraryUploadStatus.rmInLibrary.length,
            this.colorWays.length,
            this.rmMaterials.length,
            this.libraryUploadStatus.rmErrors,
            this.libraryUploadStatus.gmtErrors,
            this.finalRMErrors,
            undefined,
            this.parsedExcel.parsed_data
        )
    }

    private validateExcelJSON(jsonRow): boolean {



        const keys: string[] = [
            'SEASON',
            'STYLE_NO_INDIVIDUAL',
            'GMT_COLOR',
            'COLOR_CODE',
            'PLACEMENT_NAME',
            'SUPPLIER_NAME',
            'RM_CLR',
            'COLOR_DYING_TECHNIQUE',
        ]

        for (const key of keys) {
            if (!jsonRow.hasOwnProperty([key])) {

                return false
            }
        }
        return true

    }


    //processing
    processExcel(event) {
        const uploadedFile: File = event.target.files[0]
        console.debug(uploadedFile)
        if (!uploadedFile.name.toLowerCase().trim().endsWith('.xlsx')) {
            this.excelOk = false
            this.toastr.error('Please upload an excel document')
            event.target.value = null
        } else {
            const excelReader: FileReader = new FileReader()
            excelReader.readAsBinaryString(uploadedFile)
            excelReader.onload = (ent: ProgressEvent<FileReader>) => {
                const binaryData = ent.target.result
                const workBook: XLSX.WorkBook = XLSX.read(binaryData, { type: 'binary' })
                const firstSheetName: string = workBook.SheetNames[0]
                const firstSheet: XLSX.WorkSheet = workBook.Sheets[firstSheetName]
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: "" })

                for (let index = 0; index < jsonData.length; index++) {
                    const jsonRow = jsonData[index]
                    if (this.validateExcelJSON(jsonRow)) {
                        const modalItem: ExcelModal = new ExcelModal(
                            jsonRow['SEASON'],
                            jsonRow['STYLE_NO_INDIVIDUAL'],
                            jsonRow['GMT_COLOR'],
                            jsonRow['COLOR_CODE'],
                            jsonRow['PLACEMENT_NAME'],
                            jsonRow['SUPPLIER_NAME'],
                            jsonRow['RM_CLR'],
                            jsonRow['COLOR_DYING_TECHNIQUE'],
                            jsonRow['NRF']
                        )
                        this.excelData.push(modalItem)

                    } else {
                        this.toastr.error(`The uploaded excel is not a valid LDC format!, Error at row ${index}`)
                        event.target.value = null
                        this.excelOk = false
                        return
                    }
                }
                this.excelOk = true
                this.toastr.success('', 'Excel file uploaded successfully!');
            }
            
        }
    }


}
