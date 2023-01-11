import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { RoleInfo, SingleUserResponse, UserElement } from "./user-rqrs";
import { UserService } from "./user-service";

@Component({
    templateUrl: './user-management-component.html',
    styleUrls: ['./user-management-component.scss']
})

export class UserManagementComponent implements OnInit {
    allUsers: UserElement[]
    selectedUserId: number
    selectedUser: SingleUserResponse
    addCustomer: FormGroup
    uadd: FormGroup
    customerAddState: string
    loaderShow: boolean = false
    addUi: boolean = false
    error: string = ''

    custName: FormControl

    uname: FormControl
    ulvl: FormControl
    ualoader: boolean = false

    roles: RoleInfo[]


  constructor(private us: UserService) {
        this.custName = new FormControl('', Validators.required)
        this.addCustomer = new FormGroup({
            custName: this.custName
        }
        )

    }
    ngOnInit(): void {
        this.loadU()
    }

    private loadU() {
        this.us.allUsers()
            .subscribe(
                (s: UserElement[]) => {
                    this.allUsers = s


                },
                (e) => {

                },
                () => {

                }
            )
    }

    selectUser(e) {
        this.us.singleUser(e)
            .subscribe(
                (s) => {
                    this.selectedUser = s
                    this.selectedUserId = e
                },
                (e) => {

                },
                () => {
                }
            )
    }

    delU() {
        this.us.deleteUser(this.selectedUserId)
        .subscribe(
            () => {
                this.selectedUser = undefined
                this.selectedUserId = undefined
                this.loadU()
            },
            e => {
                alert('Unable to delete User!')
            }
            )
    }

    delc(custID) {
        this.us.deleteCustomer(this.selectedUser.user_info.user_id, custID)
            .subscribe(
                () => {
                    this.selectUser(this.selectedUser.user_info.user_id)
                },
                (e) => {

                },
                () => {

                })
    }

    addCustomerByName() {
        if (this.addCustomer.valid) {

            this.customerAddState = 'Please Wait'
            this.loaderShow = true
            this.us.addCustomer(this.selectedUserId, this.custName.value)
                .subscribe(
                    () => {
                        this.customerAddState = ''
                        this.custName.setValue('')
                    },
                    (e) => {
                        this.customerAddState = e.message
                        this.loaderShow = false
                    },
                    () => {
                        this.loaderShow = false
                        this.selectUser(this.selectedUserId)
                    }
                )
        }
    }

    addUserUI() {
        this.error = ''
        this.uname = new FormControl('', Validators.required)
        this.ulvl = new FormControl('--Select a Role--', [Validators.required, Validators.min(1)])
        this.uadd = new FormGroup({
            uname: this.uname,
            ulvl: this.ulvl
        })
        this.us.getRoles()
            .subscribe(
                (res) => {
                    this.roles = []
                    this.roles.push({ role_id: -1, role_name: '--Select a Role--' })
                    for (const rs of res) {
                        this.roles.push(rs)
                    }
                    this.ulvl.setValue(-1)

                },
                (err) => {

                },
                () => {
                    this.addUi = true
                }
            )
    }

    saveUser() {
        this.error = ''

        if (!this.uadd.valid) {
            if (this.uname.invalid) {
                this.error = 'Invalid Username'
            }
            else if (this.ulvl.invalid) {
                this.error = 'Please select a role!'
            }
        } else {
            this.ualoader = true
            this.us.addUser(this.uname.value, parseInt(this.ulvl.value))
                .subscribe(
                    () => {

                        this.us.allUsers()
                            .subscribe(
                                (s: UserElement[]) => {
                                    this.allUsers = s



                                },
                                (e) => {
                                    console.log(e)
                                    this.error = e
                                    this.ualoader = false
                                },
                                () => {
                                    this.addUi = false
                                    this.ualoader = false

                                }
                            )

                    },
                    (e) => {
                        console.log(e)
                        this.error = e.message
                        this.ualoader = false
                    },
                    () => {

                    }
                )


        }
    }

    cancel() {
        this.addUi = false
    }
}
