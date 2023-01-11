export class UserElement {
    user_info: UserInfoElement
}

export class UserInfoElement {
    user_id: number
    user_name: string
}

export class SingleUserResponse {
    user_info: UserInfoElement
    role_info: RoleInfo
    customers: CustomerElement[]

}

export class RoleInfo {
    role_id: number
    role_name: string
}

export class CustomerElement {
    customer_id: number
    customer_plm_id: string
    customer_name: string
}

export class CreateUserRequest {
    username: string
    role: number
}
