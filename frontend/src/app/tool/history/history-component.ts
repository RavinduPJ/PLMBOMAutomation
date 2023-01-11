import { Component } from "@angular/core";
import { ServiceError } from "src/app/common/error";
import { HistoryCustomerInfo, HistoryDetailsResponse, HistorySeasonInfo, HistoryStyleInfo, HistoryUploadSlotInfo, HistoryVersionInfo, LDCLineInfo } from "../requestsresponses/history-rqrs";
import { HistoryService } from "./history-service";

@Component({
    selector: 'hc',
    templateUrl: './history-component.html',
    styleUrls: ['./history-component.scss']
})

export class HistoryComponent {

    private selectedCustomer: string
    private selectedSeason: string
    private selectedStyle: string
    private selectedVersion: string


    customers: HistoryCustomerInfo[]
    seasons: HistorySeasonInfo[]
    styles: HistoryStyleInfo[]
    versions: HistoryVersionInfo[]
    uploadSlots: HistoryUploadSlotInfo[]
    details: HistoryDetailsResponse

    vwTable: LDCLineInfo[]

    showResults: boolean
    showLoader: boolean
    dispExcel: boolean
    dispErrors: boolean

    backButtonDisabled: boolean
    forwardButtonDisabled: boolean
    
    resultsError: string

    perTablePage: number = 10
    tablePageNo: number = 1

    constructor(private hs: HistoryService) {
        this.customers = []
        this.seasons = []
        this.styles = []
        this.versions = []
        this.uploadSlots = []
        this.details = null

        this.tablePageNo = 1

        this.showResults = false
        this.showLoader = false
        this.dispExcel = false
        this.dispErrors = false
        
        this.resultsError = ''

        this.selectedCustomer = ''
        this.selectedSeason = ''
        this.selectedStyle = ''
        this.selectedVersion = ''


        this.hs.getHistoryCustomers().subscribe(
            (r) => {
                this.customers = r
            },
            (e: ServiceError) => {
                if (e.code == 404) {
                    this.customers.push({
                        customer_id_plm: '-2',
                        customer_name: e.message
                    })
                }
            }
        )
    }

    customerSelected(cust) {
        this.seasons = []
        this.styles = []
        this.versions = []
        this.uploadSlots = []
        this.details = null

        this.showResults = false
        this.showLoader = false
        this.dispExcel = false
        this.dispErrors = false
        
        this.tablePageNo = 1

        this.resultsError = ''

        this.selectedCustomer = cust
        this.selectedSeason = ''
        this.selectedStyle = ''
        this.selectedVersion = ''

        if (cust === '-1' || cust === '-2') {
            return
        }
        this.hs.getSeasonForCustomer(cust)
            .subscribe(
                (r) => {
                    this.seasons = r
                },
                (e) => {
                    if (e.code == 404) {
                        this.seasons.push({
                            season_id_plm: '-2',
                            season_name: e.message
                        })
                    }
                }
            )
    }

    seasonSelected(season) {
        this.styles = []
        this.versions = []
        this.uploadSlots = []
        this.details = null

        this.showResults = false
        this.showLoader = false
        this.dispExcel = false
        this.dispErrors = false

        this.tablePageNo = 1

        this.resultsError = ''

        this.selectedSeason = season
        this.selectedStyle = ''
        this.selectedVersion = ''

        if (season === '-1' || season === '-2') {
            return
        }
        this.hs.getStyleForSeason(this.selectedCustomer, season)
            .subscribe(
                (r) => {
                    this.styles = r
                },
                (e) => {
                    if (e.code == 404) {
                        this.styles.push({
                            style_id_plm: '-2',
                            style_name: e.message
                        })
                    }
                }
            )
    }

    styleSelected(style) {
        this.versions = []
        this.uploadSlots = []
        this.details = null

        this.showResults = false
        this.showLoader = false
        this.dispExcel = false
        this.dispErrors = false

        this.tablePageNo = 1

        this.resultsError = ''

        this.selectedStyle = style
        this.selectedVersion = ''

        if (style === '-1' || style === '-2') {
            return
        }

        this.hs.getVersionForStyle(this.selectedCustomer, this.selectedSeason, style)
            .subscribe(
                (r) => {
                    this.versions = r
                },
                (e) => {
                    if (e.code == 404) {
                        this.versions.push({
                            bom_version_id_plm: '-2',
                            bom_version_name: e.message
                        })
                    }
                }
            )

    }

    bomSelected(bom) {
        this.uploadSlots = []
        this.details = null

        this.showResults = false
        this.showLoader = false
        this.dispExcel = false
        this.dispErrors = false

        this.tablePageNo = 1

        this.resultsError = ''

     
        this.selectedVersion = bom

        if (bom === '-1' || bom === '-2') {
            return
        }
        this.hs.getUploadSlotForVersion(this.selectedCustomer, this.selectedSeason, this.selectedStyle, bom)
        .subscribe(
            (r) => {
                this.uploadSlots = r
            },
            (e) => {
                if (e.code == 404) {
                    this.uploadSlots.push({
                        id: -2,
                        uploaded_date: null
                    })
                }
            }
        )

     
    }

    slotSelected(slot){
        this.details = null
        this.showResults = false
        this.showLoader = false
        this.dispExcel = false
        this.dispErrors = false

        this.tablePageNo = 1

        this.resultsError = ''
        if(slot === '-1' || slot === '-2'){
            return
        }
        this.showLoader = true
        this.hs.getDetailsFromUploadSlot(this.selectedCustomer, this.selectedSeason, this.selectedStyle, this.selectedVersion, slot)
        .subscribe(
            (r) => {
                this.details = r
                console.log(this.details)
            },
            (e) => {
                this.showLoader = false
                this.resultsError = e.message
            },
            () =>{
                this.showLoader = false
                this.showResults = true
            }
        )
    }

    showExcel(){
        this.refreshTable()
        this.dispExcel = true
    }
    closeExcel(){
       this.dispExcel = false
    }
    tablePageBack() {
        this.tablePageNo--
        this.refreshTable()
    }

    showErrors(){
        this.dispErrors = true
    }
    closeErrors(){
        this.dispErrors = false
    }

    tablePageForward() {
        this.tablePageNo++
        this.refreshTable()
    }
    refreshTable() {
        const tablePageIndex = this.tablePageNo - 1
        const totalTablePages = Math.trunc(this.details.details.length / this.perTablePage)
        this.vwTable = this.details.details.slice(tablePageIndex * this.perTablePage, (tablePageIndex * this.perTablePage) + this.perTablePage)
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

}