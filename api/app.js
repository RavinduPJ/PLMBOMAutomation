import('express').then((express) => {
    import('got').then((g) => {
        import('pg').then((p) => {

            var cors = require('cors');
            const got = g.default
            const pg = p.default
            const app = express.default()
            app.use(cors())
            const rtr = express.Router()
            const masterRouter = express.Router()
            const colorRouter = express.Router()
            const bomRouter = express.Router()
            const userRouter = express.Router()
            const cdtRouter = express.Router()
            const historyRouter = express.Router()

            const { Pool } = pg

            const baseUrl = 'https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2'
            const login = `${baseUrl}/session`
            const customers = `${baseUrl}/customers`
            const suppliers = `${baseUrl}/suppliers`
            const styles = `${baseUrl}/styles`
            const color_ways = `${baseUrl}/colorways`
            const materials = `${baseUrl}/materials`
            const boms = `${baseUrl}/apparel_boms`
            const bom_revs = `${baseUrl}/apparel_bom_revisions`
            const part_materials = `${baseUrl}/part_materials`

            /**
             * DB related info from environment
             */
            // const db_user = process.env.bomtool_db_user_name
            // const db_password = process.env.bomtool_db_user_password
            // const db_host = process.env.bomtool_db_host
            // const db_catalog = process.env.bomtool_db_catalog

            const db_user = 'postgres'
            const db_password = 'P@ssw0rd'
            const db_host = 'localhost'
            const db_catalog = 'plmbomautomation'
            const db_port = '5400'

            /**
             * Server Port
             */
            const PORT = 8780

            if (!db_user || !db_password || !db_host || !db_catalog) {
                console.error('Database configuration params are missing from environment!')
                process.exit(-1)
            }

            const pool = new Pool({
                user: db_user,
                host: db_host,
                database: db_catalog,
                password: db_password,
                port: db_port
            })


            /**
             * 
             * @param {*} req 
             * @param {*} res 
             * @param {()} next 
             * @returns call to next
             */
            function tokenValidator(req, res, next) {
                if (!req.headers.token) {
                    return res.status(400).json({ error: "Token must required" })
                }
                req.tokenCookie = req.headers.token
                next()
            }

            /**
             * Initialize Routers
             * Routers are
             *  1.  Master router (/api/master/) => get the master data such as Customer, Season, Style, BOM and silhouette
             *  2.  Color Router (/api/color/) => Add Colors to Color Library
             *  3.  BOM Router (/api/bom/) => BOM creation routers
             *  4.  User Router (/api/user) => Managing Users
             *  5.  Color Dying Technique Router (/api/cdt)
             *  6.  History Router (/api/history) => Manage history
             */
            rtr.use(express.json({ limit: '50mb' }))
            rtr.use('/master', tokenValidator)
            rtr.use('/master', masterRouter)
            rtr.use('/color', tokenValidator)
            rtr.use('/color', colorRouter)
            rtr.use('/bom', tokenValidator)
            rtr.use('/bom', bomRouter)
            rtr.use('/user', tokenValidator)
            rtr.use('/user', userRouter)
            rtr.use('/cdt', cdtRouter)
            rtr.use('/history', historyRouter)

            app.use('/api', rtr)



            app.listen(PORT, () => {
                console.log(`Server is Listening of port ${PORT}`)
            })

            const cdt_map = []

            /**
             * This method is used to initialize the color dying technique.
             * Basicakky, it reads the CDT info from database and put it to cdt_map array.
             * When there is a modification to CDT, this method will be called again!
             */
            const initCdt = () => {
                pool.query('SELECT cdt_ldc, cdt_plm FROM cdt WHERE cdt_active = true', (e, r) => {
                    if (e) {
                        throw (e)
                    }
                    cdt_map.length = 0
                    if (r.rowCount > 0) {
                        for (const row of r.rows) {
                            cdt_map.push({
                                ldc: row.cdt_ldc,
                                plm: row.cdt_plm
                            })
                        }
                    }


                })
            }

            initCdt()

            /**
             * Login Endpoint (POST to login)
             * Request Body : {"username":"user_name", "password": "pass_word"}
             * Return Response Codes
             *  400, 500, 401, 200
             * Return Response Body (200)
             *  {
                "cookie": string,
                "user_id": number,
                "type": number,
                "desc": string
                }
             */

            rtr.get('/connection', (req, res) => {
                return res.status(200).json({ success: 'Api Connected' });

            })
               
            rtr.post('/login', (req, res) => {
                
                const rbody = req.body;
                if (!rbody.username) {
                    return res.status(400).json({ error: 'Username not specified' })
                }
                if (!rbody.password) {
                    return res.status(400).json({ error: 'Password not specified' })
                }


                pool.query(`SELECT users.id, roles.id AS role, roles.role AS role_desc  FROM users INNER JOIN roles ON roles.id = users.role WHERE LOWER(users.username) = LOWER('${rbody.username.toLowerCase().trim()}')`, (err, dbr) => {
                    if (err) {
                        return res.status(500).json({ error: 'Unable to query existance of the user', db: err })
                    }
                    if (dbr.rowCount == 0) {
                        return res.status(401).json({ error: 'User does not exist!' })
                    }
                    const uid = dbr.rows[0].id
                    const role = dbr.rows[0].role
                    const role_desc = dbr.rows[0].role_desc

                    got.post(login, { json: rbody })
                        .then((success) => {
                            const respBody = JSON.parse(success.body)
                            const cookie = { cookie: respBody.token, user_id: uid, type: role, desc: role_desc }
                            return res.contentType('application/json').send(cookie)
                        }, reject => {
                            if (reject.response.statusCode == 400) {
                                return res.status(400).json({ "error": "Invalid username or password" })
                            }

                        })
                        .catch((err) => { console.error(err) })

                })


            })

            /**
             * Login Endpoint (DELETE to logout)
             * Request Body : none
             * Header Required : token (token=string)
             * Return Response Codes
             *  400, 500, 204
             * Return Response Body : none
             */
            rtr.delete('/login', (req, res) => {
                const tok = req.headers.token
                if (!tok) {
                    return res.status(400).json({ error: 'Token not specified' })
                }
                got.delete(login, { headers: { cookie: tok } }).json()
                    .then(
                        (success) => {
                            return res.sendStatus(204)
                        },
                        () => {

                            return res.status(400).json({ error: 'The specified token is already logged out or invalid!' })
                        }
                    )
                    .catch(
                        e => {
                            console.error(e)
                            return res.status(500).json({ error: 'An error occurred while deleting the token from PLM!' })
                        }
                    )
            })

            /**
             * Parse Endpoint
             * This endpoint is used to convert LDC's excel JSON format to a format where it is used internally.
             * Request Body : 
             * [
             *  {
             *      "rm_color": string,
                    "rm_color_code": string,
                    "rm_color_supplier": string,
                    "rm_color_placement": string,
                    "rm_color_cdt": string,
                    "gmt_color": string,
                    "gmt_color_code": string
             *  }, ...
             * ]
             * Header Required : none
             * Return Response Codes
             *  200
             * Return Response Body  : 
             * [
             *  {
                    "reference_index": number,
                    "rm_color": string,
                    "rm_color_code": string,
                    "rm_color_supplier": string,
                    "rm_color_placement": string,
                    "rm_color_cdt": string,
                    "gmt_color": string,
                    "gmt_color_code": string
                }, ...
             * ]
             */
            rtr.post('/parse', (req, res) => {
                const ldcColors = req.body
                const parsedColors = []

                parsedColors.contains = (rm_color, rm_color_code, rm_color_supplier, rm_color_placement, rm_color_cdt, gmt_color, gmt_color_code) => {
                    const _rm_color = String(rm_color).trim().toLowerCase()
                    const _rm_color_code = String(rm_color_code).trim().toLowerCase()
                    const _rm_color_supplier = String(rm_color_supplier).trim().toLowerCase()
                    const _rm_color_placement = String(rm_color_placement).trim().toLowerCase()
                    const _rm_color_cdt = String(rm_color_cdt).trim().toLowerCase()
                    const _gmt_color = String(gmt_color).trim().toLowerCase()
                    const _gmt_color_code = String(gmt_color_code).trim().toLowerCase()



                    for (const parsedColor of parsedColors) {


                        const __rm_color = String(parsedColor.rm_color).trim().toLowerCase()
                        const __rm_color_code = String(parsedColor.rm_color_code).trim().toLowerCase()
                        const __rm_color_supplier = String(parsedColor.rm_color_supplier).trim().toLowerCase()
                        const __rm_color_placement = String(parsedColor.rm_color_placement).trim().toLowerCase()
                        const __rm_color_cdt = String(parsedColor.rm_color_cdt).trim().toLowerCase()
                        const __gmt_color = String(parsedColor.gmt_color).trim().toLowerCase()
                        const __gmt_color_code = String(parsedColor.gmt_color_code).trim().toLowerCase()


                        if (_rm_color === __rm_color && _rm_color_code === __rm_color_code && _rm_color_supplier === __rm_color_supplier && _rm_color_placement === __rm_color_placement && _rm_color_cdt === __rm_color_cdt && _gmt_color === __gmt_color && _gmt_color_code === __gmt_color_code) {
                            return true
                        }
                    }
                    return false

                }

                parsedColors.add = (index, rm_color, rm_color_code, rm_color_supplier, rm_color_placement, rm_color_cdt, gmt_color, gmt_color_code) => {
                    if (!parsedColors.contains(rm_color, rm_color_code, rm_color_supplier, rm_color_placement, rm_color_cdt, gmt_color, gmt_color_code)) {
                        parsedColors.push({
                            reference_index: index,
                            rm_color: rm_color,
                            rm_color_code: rm_color_code,
                            rm_color_supplier: rm_color_supplier,
                            rm_color_placement: rm_color_placement,
                            rm_color_cdt: rm_color_cdt,
                            gmt_color: gmt_color,
                            gmt_color_code: gmt_color_code
                        })

                    } else {

                    }


                }

                for (let index = 0; index < ldcColors.length; index++) {
                    const ldcColor = ldcColors[index];
                    const { rm_color, rm_color_code, rm_color_supplier, rm_color_placement, rm_color_cdt, gmt_color, gmt_color_code } = ldcColor
                    parsedColors.add(index, rm_color, rm_color_code, rm_color_supplier, rm_color_placement, rm_color_cdt, gmt_color, gmt_color_code)

                }

                console.log(parsedColors.length)


                return res.json(parsedColors)
            })

            /**
             * User Roles Retrieve End Point
             * This End Point returns all user roles that are in the database
             * Request Body : None
             * Header Required : None
             * Return Codes : 500, 404, 200
             * Return Response Body (200) : [
             *  {
             *      role_id: number,
             *      role_name: string
             *  },...
             * ]
             * Return Response Body (500, 404) : {
             *  error: string,
             *  db: object 
             * }
             */
            rtr.get('/roles', (_, res) => {
                pool.query('SELECT * FROM roles', (e, r) => {
                    if (e) {
                        return res.status(500).json({ error: 'Unable to query roles from database!', db: e })
                    }
                    if (r.rowCount == 0) {
                        return res.status(404).json({ error: 'No roles found!' })
                    }
                    return res.json(r.rows.map(rs => ({ role_id: rs.id, role_name: rs.role })))
                })
            })

            /**
             * Users retrieve endpoint
             * This End Point returns all the users that are in the database
             * Request Body : None
             * Header Required : token (token=string)
             * Return Codes : 500, 404, 200
             * Return Response Body (200) : [
             *  {
             *      user_info : {
             *          user_id : number
             *          user_name : string
             *      },
             *      role_info : {
             *          role_id : number,
             *          role_name : string
             *      }
             *  },...
             * ]
             * Return Response Body (500, 404) : {
             *  error: string,
             *  db: object 
             * }
             */
            userRouter.get('/', (_, res) => {
                pool.query('SELECT users.id, users.username, users.role, roles.id AS role_id, roles.role AS role_name FROM users INNER JOIN roles ON users.role = roles.id', (err, dbr) => {
                    if (err) {
                        return res.status(500).json(err)
                    }
                    if (dbr.rowCount < 1) {
                        return res.status(404).json({ error: 'No users found' })
                    }
                    const user_arr = []
                    for (const user of dbr.rows) {
                        user_arr.push(
                            {
                                user_info: {
                                    user_id: user.id,
                                    user_name: user.username
                                },
                                role_info: {
                                    role_id: user.role_id,
                                    role_name: user.role_name
                                }
                            }
                        )
                    }
                    return res.json(user_arr)
                })
            })

            /**
             * Users Create endpoint (POST)
             * This End Point creates a new user in the system
             * Request Body : {
             *      username : string,
             *      password : string,
             *      role : number
             * }
             * Header Required : token (token=string)
             * Return Codes : 500, 409, 400, 201
             * Return Response Body (201) : {
             *      status : string
             * }
             * Return Response Body (500, 409, 400) : {
             *  error: string,
             *  db: object 
             * }
             */
            userRouter.post('/', (req, res) => {
                const rqbody = req.body

                if (!rqbody.username) {
                    return res.status(400).json({ error: 'Username is required!' })
                }
                if (!rqbody.role) {
                    return res.status(400).json({ error: 'User role is required!' })
                }


                pool.query(`SELECT COUNT(*) FROM users WHERE LOWER(username) = '${rqbody.username.toLowerCase().trim()}'`, (err, dbr) => {
                    if (err) {
                        return res.status(500).json({ error: 'Unable to query existance of the user', db: err })
                    }
                    if (parseInt(dbr.rows[0].count) > 0) {
                        return res.status(409).json({ error: 'User already exits!' })
                    }
                    pool.query(`INSERT INTO users (username, role)VALUES('${rqbody.username}',${parseInt(rqbody.role)})`, (err, _) => {
                        if (err) {
                            return res.status(500).json({ error: 'Unable to insert user to the database!', db: err })
                        }
                        return res.status(201).json({ status: 'Created!' })
                    })


                })
            })

            cdtRouter.get('/', (_, res) => {
                pool.query('SELECT * FROM cdt ORDER BY id ASC', (e, r) => {
                    const ret = []
                    if (e) {
                        return res.status(500).json({ error: 'Unable to query color dying techniques', db: e })
                    }
                    if (r.rowCount == 0) {
                        return res.status(400).json({ error: 'No color dying techniques found!' })
                    }
                    for (const cd of r.rows) {
                        ret.push({
                            id: cd.id,
                            ldc_cdt: cd.cdt_ldc,
                            plm_cdt: cd.cdt_plm,
                            state_cdt: cd.cdt_active
                        })
                    }
                    return res.json(ret)
                })

            })
            cdtRouter.post('/', (req, res) => {
                if (!req.body.cdt_plm) {
                    return res.status(400).json({ error: 'Color dying technique in PLM string is required!' })
                }
                if (!req.body.cdt_ldc) {
                    return res.status(400).json({ error: 'Color dying technique in Lab Dip Chart string is required!' })
                }
                const ldc = req.body.cdt_ldc.trim()
                const plm = req.body.cdt_plm.trim()

                pool.query("SELECT * FROM cdt WHERE LOWER(cdt_ldc) = LOWER($1) AND LOWER(cdt_plm) = LOWER($2)", [ldc, plm], (e, r) => {
                    if (e) {
                        return res.status(500).json({ error: 'Unable to check the mapping existance!', db: e })
                    }

                    if (r.rowCount > 0) {
                        return res.status(409).json({ error: 'The mapping already exists!' })
                    }

                    pool.query(`INSERT INTO cdt (cdt_ldc,cdt_plm)VALUES('${ldc}','${plm}')`, (e, _) => {
                        if (e) {
                            return res.status(500).json({ error: 'Unable to save color dying technique mapping!', db: e })
                        }

                        initCdt()
                        return res.status(201).json({ status: 'Mapping Created!' })
                    })
                })




            })
            cdtRouter.patch('/:cdt_id', (req, res) => {
                const reqData = req.body
                let sql = "UPDATE cdt "

                let ldc_update = false
                let plm_update = false
                let act_update = false

                const valArr = []

                if (!req.params.cdt_id) {
                    return res.status(400).json({ error: 'ID is required!' })
                }
                const id = parseInt(req.params.cdt_id)

                if (isNaN(id)) {
                    return res.status(400).json({ error: 'Invalid ID!' })
                }

                if (!reqData) {
                    return res.sendStatus(204)
                }

                pool.query("SELECT * from cdt WHERE id = $1", [req.params.cdt_id], (e, r) => {
                    if (e) {
                        return res.status(500).json({ error: 'Unable to query for existance of technique mapping!', db: e })
                    }
                    if (r.rowCount == 0) {
                        return res.status(404).json({ error: 'Color dying technique mapping not found!' })
                    }

                    const current_ldc = r.rows[0].cdt_ldc
                    const current_plm = r.rows[0].cdt_plm

                    let ldc = reqData.cdt_ldc
                    let plm = reqData.cdt_plm
                    let act = reqData.cdt_act

                    if (ldc) {
                        ldc = ldc.trim()
                        sql += 'SET cdt_ldc = $1 '
                        ldc_update = true
                        valArr.push(ldc)
                    }

                    if (plm) {
                        plm = plm.trim()
                        plm_update = true
                        if (ldc_update) {
                            sql += ', cdt_plm = $2 '
                        }
                        else {
                            sql += 'SET cdt_plm = $1 '
                        }
                        valArr.push(plm)
                    }

                    if (act == true || act == false) {
                        act_update = true
                        if (plm_update && ldc_update) {
                            sql += ', cdt_active = $3 '
                        } else if (ldc_update || plm_update) {
                            sql += ', cdt_active = $2 '
                        } else {
                            sql += 'SET cdt_active = $1 '
                        }
                        valArr.push(act)
                    }

                    sql += 'WHERE id = $'

                    if (valArr.length == 0) {
                        return res.sendStatus(204)
                    }

                    sql += String(valArr.length + 1)


                    valArr.push(req.params.cdt_id)


                    if (ldc_update || plm_update) {

                        pool.query('SELECT * FROM cdt WHERE LOWER(cdt_ldc) = LOWER($1) AND LOWER(cdt_plm) = LOWER($2)', [ldc_update ? ldc : current_ldc, plm_update ? plm : current_plm], (e, r) => {
                            if (e) {
                                return res.status(500).json({ error: 'Unable to query for duplicate check!', db: e })
                            }

                            if (r.rowCount > 0) {
                                return res.status(409).json({ error: 'The mapping already exists!' })
                            }

                            __upd(sql, valArr)
                        })

                    }

                    if (act_update) {
                        __upd(sql, valArr)
                    }

                    function __upd(_sql, _va) {


                        pool.query(_sql, _va, (e, _) => {
                            if (e) {
                                return res.status(500).json({ error: 'Unable to update color dye technique mapping!', db: e })
                            }
                            return res.sendStatus(204)
                        })
                    }

                })
            })
            cdtRouter.delete('/:cdt_id', (req, res) => {
                if (!req.params.cdt_id) {
                    return res.status(400).json({ error: 'ID is required!' })
                }
                const id = parseInt(req.params.cdt_id)

                if (isNaN(id)) {
                    return res.status(400).json({ error: 'Invalid ID!' })
                }

                pool.query(`DELETE FROM cdt WHERE id = ${id}`, (e, r) => {
                    if (e) {
                        return res.status(500).json({ error: 'Unable to delete the color dyinh technique mapping!', db: { e } })
                    }
                    if (r.rowCount == 0) {
                        return res.status(404).json({ error: 'Color dying technique mapping not found!' })
                    }
                    initCdt()
                    return res.sendStatus(204)
                })
            })

            userRouter.get('/:user', (req, res) => {
                const q_user = req.params.user.trim()
                const ret = {}
                if (!q_user) {
                    return res.status(400).json({ error: 'User ID required!' })
                }
                pool.query(`SELECT users.id, users.username, users.role AS role_id, roles.role AS role_name, customers.id AS customer_id, customers.plm_id, customers.customer_name FROM users 
    INNER JOIN roles on users.role = roles.id
    LEFT OUTER JOIN customers on users.id = customers.designated_user
    WHERE users.id = ${q_user}`, (err, dbr) => {
                    if (err) {
                        return res.status(500).json({ error: err })
                    }
                    if (dbr.rowCount < 1) {
                        return res.status(404).json({ error: `User with id ${q_user} does not exist!` })
                    }



                    for (const row of dbr.rows) {
                        if (!ret.user_info) {
                            ret.user_info = {}
                            ret.user_info.user_id = row.id,
                                ret.user_info.user_name = row.username

                            ret.role_info = {
                                role_id: row.role_id,
                                role_name: row.role_name
                            }


                        }


                        if (row.customer_id !== null) {

                            if (!ret.customers) {
                                ret.customers = []
                            }

                            ret.customers.push({
                                customer_id: row.customer_id,
                                customer_plm_id: row.plm_id,
                                customer_name: row.customer_name
                            })
                        }



                    }
                    return res.json(ret)
                })

            })

            userRouter.delete('/:user', (req, res) => {
                const q_user = req.params.user.trim()
                if (!q_user) {
                    return res.status(400).json({ error: 'User ID required!' })
                }
                const sql_user = "DELETE FROM users WHERE id = $1"
                const sql_customer = "DELETE FROM customers WHERE designated_user = $1"

                pool.query(sql_customer, [q_user], (e, _) => {
                    if (e) {
                        return res.status(500).json({ error: 'An error occurred while deleting asigned customers!', db: e })
                    }

                    pool.query(sql_user, [q_user], (e, r) => {
                        if (e) {
                            return res.status(500).json({ error: 'An error occurred while deleting user!', db: e })
                        }
                        if (r.rowCount < 1) {
                            return res.status(404).json({ error: `User with id ${q_user} does not exist!` })
                        }
                        return res.sendStatus(204)
                    })

                })
            })

            userRouter.get('/:user/customers', (req, res) => {
                const uid = req.params.user.trim()
                const ret = []

                if (!uid) {
                    return res.status(400).json({ error: 'User ID is required!' })
                }

                const _uid = parseInt(uid)

                pool.query(`SELECT CASE WHEN COUNT(*) > 0  THEN true ELSE false END as exist  FROM users WHERE id = ${_uid}`, (err, dbr) => {
                    if (err) {
                        return res.status(500).json({ error: err })
                    }
                    if (dbr.rows[0].exist === false) {
                        return res.status(404).json({ error: 'User does not exist!' })
                    }

                    pool.query(`SELECT * FROM customers WHERE designated_user = ${_uid}`, (err, dbr) => {
                        if (err) {
                            return res.status(500).json({ error: err })
                        }
                        if (dbr.rowCount < 1) {
                            return res.status(400).json({ error: 'No customers are assigned for this user!' })
                        }
                        for (const row of dbr.rows) {
                            ret.push(
                                {
                                    customer_id: row.id,
                                    customer_plm_id: row.plm_id,
                                    customer_name: row.customer_name
                                }
                            )
                        }
                        return res.json(ret)
                    })


                })


            })
            userRouter.post('/:user/customers', (req, res) => {
                const uid = req.params.user.trim()
                const crq = req.body;


                if (!uid) {
                    return res.status(400).json({ error: 'User ID is required!' })
                }
                if (!crq.customer_name) {
                    return res.status(400).json({ error: 'Customer name is required!' })
                }

                const _uid = parseInt(uid)
                const _cname = crq.customer_name.trim().replaceAll(' ', '%20').replaceAll('+', '%2B').replaceAll(',', '%2C')

                pool.query(`SELECT CASE WHEN COUNT(*) > 0  THEN true ELSE false END as exist  FROM users WHERE id = ${_uid}`, (err, dbr) => {
                    if (err) {
                        return res.status(500).json({ error: err })
                    }
                    if (dbr.rows[0].exist === false) {
                        return res.status(404).json({ error: 'User does not exist!' })
                    }
                    got.get(`${customers}?limit=0&node_name=${_cname}`, { headers: { cookie: req.tokenCookie } }).json()
                        .then(
                            (success) => {
                                if (success.length == 0) {
                                    return res.status(404).json({ error: 'No customer with that name exists in PLM!' })
                                }
                                const [cust] = success
                                pool.query(`SELECT CASE WHEN COUNT(*) > 0  THEN true ELSE false END as exist  FROM customers WHERE plm_id = '${cust.id}' AND designated_user = ${_uid}`, (err, dbr) => {

                                    if (err) {
                                        return res.status(500).json({ error: err })
                                    }
                                    if (dbr.rows[0].exist === true) {
                                        return res.status(404).json({ error: 'This customer is already assigned to the speicifed user!' })
                                    }
                                    pool.query(`INSERT INTO customers(plm_id, customer_name, designated_user)VALUES('${cust.id}','${cust.node_name}',${_uid})`, (err, dbr) => {
                                        if (err) {
                                            return res.status(500).json({ error: err })
                                        }
                                        if (dbr.rowCount < 1) {
                                            return res.status(500).json({ error: 'Unable to save customer against the user to the database!' })
                                        }

                                        return res.status(201).json({ status: 'success' })
                                    })
                                })
                            },
                            () => {
                                return res.status(400).json({ error: 'Error on checking customer existance in PLM!' })
                            }
                        ).catch(
                            e => {
                                console.error(e)
                                return res.status(500).json({ error: 'An error occurred when checking customer existance in PLM!' })
                            }
                        )
                })
            })
            userRouter.delete('/:user/customers/:customer', (req, res) => {
                const uid = req.params.user.trim()
                const cid = req.params.customer.trim()


                if (!uid) {
                    return res.status(400).json({ error: 'User ID is required!' })
                }
                if (!cid) {
                    return res.status(400).json({ error: 'Customer ID is required!' })
                }

                const _uid = parseInt(uid)
                const _cid = parseInt(cid)

                pool.query(`SELECT CASE WHEN COUNT(*) > 0  THEN true ELSE false END as exist  FROM users WHERE id = ${_uid}`, (err, dbr) => {
                    if (err) {
                        return res.status(500).json({ error: err })
                    }
                    if (dbr.rows[0].exist === false) {
                        return res.status(404).json({ error: 'User does not exist!' })
                    }

                    pool.query(`SELECT CASE WHEN COUNT(*) > 0  THEN true ELSE false END as exist  FROM customers WHERE id = ${_cid}`, (err, dbr) => {
                        if (err) {
                            return res.status(500).json({ error: err })
                        }
                        if (dbr.rows[0].exist === false) {
                            return res.status(404).json({ error: 'Customer does not exist!' })
                        }

                        pool.query(`DELETE FROM customers WHERE designated_user = ${_uid} AND id = ${_cid}`, (err, dbr) => {
                            if (err) {
                                return res.status(500).json({ error: err })
                            }
                            if (dbr.rowCount < 1) {
                                return res.status(400).json({ error: 'The specified customer does not assigned to this particular user!' })
                            }
                            return res.sendStatus(204)
                        })
                    })
                })
            })
            masterRouter.get('/customers', (req, res) => {
                const userId = req.query.userId

                got.get('https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/customers?limit=0', { headers: { cookie: req.tokenCookie } }).json().then(
                    async (success) => {
                        const respJson = success
                        const custData = []
                        let r
                        if (userId) {
                            try {


                                r = await pool.query(`SELECT plm_id FROM customers WHERE designated_user = ${userId}`)
                                if (r.rowCount == 0) {
                                    return res.status(404).json({ error: 'No customers assigned or no valid customers found!' })
                                }
                            } catch (ex) {
                                return res.status(500).json({ error: 'Unable to query customer for the user!', db: ex })
                            }
                        }
                        for (const custInfo of respJson) {
                            const ci = {}
                            ci.id = custInfo.id
                            ci.name = custInfo.node_name
                            if (userId) {
                                for (const row of r.rows) {
                                    if (row.plm_id === ci.id) {
                                        custData.push(ci)
                                    }
                                }
                            } else {
                                custData.push(ci)
                            }

                        }
                        console.log(custData)
                        if (custData.length > 0) {
                            return res.json(custData)
                        } else {
                            return res.status(404).json({ error: 'No customers assigned or no valid customers found!' })
                        }

                    },
                    (reject) => { return res.status(400).send(reject.response.body) }
                ).catch((issue) => { return res.status(500) })

            })
            masterRouter.get('/customer/:customer_id/seasons', (req, res) => {

                const custId = req.params.customer_id.trim()
                if (!custId) {
                    return res.status(400).json({ error: 'Customer ID is required' })
                }
                got.get(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/customers?limit=0&id=${custId}`, { headers: { cookie: req.tokenCookie } })
                    .then(
                        (success) => {
                            const respJson = JSON.parse(success.body)
                            if (respJson.length == 0) {
                                return res.status(404).json({ error: "Customer not found" })
                            }
                            got.get(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/seasons?bx_season_customer=${custId}&limit=0`, { headers: { cookie: req.tokenCookie } })
                                .then(
                                    (success) => {
                                        const respJSON = JSON.parse(success.body)
                                        const yearAndSeason = []
                                        if (respJSON.length == 0) {
                                            return res.status(404).json({ error: "No seasons found for this customer" })
                                        }

                                        for (const seasonData of respJSON) {
                                            yearAndSeason.push({
                                                id: seasonData.id,
                                                name: seasonData.node_name,
                                                year: seasonData.bx_season_year,
                                                season: seasonData.bx_season_period,
                                            })
                                        }

                                        return res.json(yearAndSeason)


                                    },
                                    (rejected) => {

                                    }
                                ).catch((issue) => {
                                    return res.status(500)
                                })

                        },
                        (rejected) => {
                            if (rejected.response.statusCode == 406) {
                                return res.status(404).json({ error: "Customer not found" })
                            }
                            return res.status(400).json(rejected.response.body)
                        }
                    ).catch((issue) => {
                        return res.status(500)
                    })


            })
            masterRouter.get('/season/:season_id/styles', (req, res) => {
                const sessionId = req.params.season_id.trim()
                if (!sessionId) {
                    return res.status(400).json({ error: "Session ID is required" })
                }
                got.get(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/seasons?id=${sessionId}`, { headers: { cookie: req.tokenCookie } })
                    .then(
                        (success) => {
                            const respJson = JSON.parse(success.body)
                            if (respJson.length == 0) {
                                return res.status(404).json({ error: "Season not found" })
                            }
                            got.get(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/styles?parent_season=${sessionId}&limit=0`, { headers: { cookie: req.tokenCookie } })
                                .then((success) => {
                                    const respJSON = JSON.parse(success.body)
                                    const styleData = []
                                    if (respJSON.length == 0) {
                                        return res.status(404).json({ error: "No styles found for this season ID" })
                                    }

                                    for (const styleInfo of respJSON) {
                                        styleData.push({
                                            id: styleInfo.id,
                                            name: styleInfo.node_name
                                        })
                                    }

                                    return res.json(styleData)

                                },
                                    (rejected) => {

                                    })
                                .catch(issue => {
                                    return res.status(500)
                                })
                        },
                        (rejected) => {
                            if (rejected.response.statusCode == 406) {
                                return res.status(404).json({ error: "Season not found" })
                            }
                            return res.status(400).json(rejected.response.body)
                        }
                    ).catch(issue => { return res.status(500) })


            })
            masterRouter.get('/style/:style_id/bom', (req, res) => {
                const style_id = req.params.style_id.trim()
                if (!style_id) {
                    return res.status(400).json({ error: 'Style ID is required' })
                }
                got.get(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/styles?id=${style_id}`, { headers: { cookie: req.tokenCookie } })
                    .then(
                        (success) => {
                            const respJson = JSON.parse(success.body)
                            if (respJson.length == 0) {
                                return res.status(404).json({ error: 'Style not found' })
                            }
                            got.get(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/styles/${style_id}/data_sheets/apparel_boms`, { headers: { cookie: req.tokenCookie } })
                                .then(
                                    (success) => {
                                        const respJSON = JSON.parse(success.body)
                                        const bomData = []
                                        if (respJSON.length == 0) {
                                            return res.status(404).json({ error: 'No BOM(s) for the specified style' })
                                        }
                                        for (const bomInfo of respJSON) {
                                            const bomVersions = []
                                            for (const bomVersionInfo of bomInfo.revisions) {
                                                bomVersions.push(bomVersionInfo)
                                            }
                                            bomData.push({
                                                id: bomInfo.id,
                                                name: bomInfo.node_name,
                                                description: bomInfo.description,
                                                version: bomInfo.current_revision,
                                                versions: bomVersions
                                            })
                                        }
                                        return res.json(bomData)
                                    },
                                    (rejected) => {

                                    }
                                ).catch(issue => {
                                    return res.status(500)
                                })
                        },
                        (rejected) => {
                            if (rejected.response.statusCode == 406) {
                                return res.status(404).json({ error: 'Style not found' })
                            }
                            return res.status(400).json(rejected.response.body)
                        }
                    ).catch(issue => { return res.status(500) })

            })
            masterRouter.get('/silhouettes', (req, res) => {


                got.get('https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/enum_lists?node_name=bxSilhoutte', { headers: { cookie: req.tokenCookie } })
                    .then(
                        (success) => {
                            const respJSON = JSON.parse(success.body)
                            const [{ values }] = respJSON;
                            var idConcat = 'id='
                            for (const value of values) {

                                idConcat += `${value}&id=`
                            }
                            idConcat = idConcat.substring(0, idConcat.length - '&id='.length)
                            console.log(idConcat)
                            got.get(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/enum_values?${idConcat}`, { headers: { cookie: req.tokenCookie } })
                                .then(
                                    (success) => {
                                        const respJSON = JSON.parse(success.body)
                                        const resp = []
                                        for (const sil of respJSON) {
                                            const { id } = sil
                                            const { node_name } = sil
                                            resp.push(
                                                {
                                                    id: id,
                                                    name: node_name
                                                }
                                            )
                                        }
                                        return res.status(200).json(resp)
                                    },
                                    (rejected) => {
                                        console.error(rejected)
                                        return res.sendStatus(400)
                                    }

                                ).catch(
                                    issue => { return res.sendStatus(500) }
                                )
                        },
                        (rejected) => {
                            console.error(rejected)
                            return res.sendStatus(400)
                        }
                    ).catch(
                        issue => { return res.status(500) }
                    )
            })

            colorRouter.post('/gmt', (req, res) => {
                const response = {}
                const gmt_filtered_array = []

                response.errors = []
                response.successes = []
                response.existed = []
                response.totalErrors = 0
                response.totalSuccess = 0
                response.totalGMT = 0
                response.totalExist = 0


                console.log("Basic validation")
                if (!(req.body.customerId)) {
                    return res.status(400).json({ error: 'Customer ID is required!' })
                }
                if (!(req.body.gmt_array)) {
                    return res.status(400).json({ error: 'Garment color array is required!' })
                }
                if (!(req.body.gmt_array instanceof Array)) {
                    return res.status(400).json({ error: 'Request must be an array!' })
                }
                if (req.body.gmt_array.length == 0) {
                    return res.status(400).json({ error: 'Array has no elements!' })
                }

                for (const indx in req.body.gmt_array) {
                    const col = req.body.gmt_array[indx]

                    if (!col.color) {
                        response.errors.push(`Missing GMT color name in LDC line ${indx}`)
                    }

                    if (!col.nrf) {
                        response.errors.push(`Missing GMT color code in LDC line ${indx}`)
                    }

                    if (!col.color || !col.nrf) {
                        response.totalErrors++
                        continue
                    }
                    gmt_filtered_array.push(col)
                }
                const customerID = req.body.customerId

                console.log("Check customer ID exist!")
                //1. check weather customer id exist!
                got.get(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/customers/${customerID}`, { headers: { cookie: req.tokenCookie } })
                    .then(
                        (success) => {
                            console.log("Get colors in color spec!")
                            //2. get all the colors in color spec!
                            got.get('https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/color_specifications?limit=0&bx_source_type=Customer&bx_color_print=Garment', { headers: { cookie: req.tokenCookie } })
                                .then(
                                    (success) => {
                                        const respJSON = JSON.parse(success.body)
                                        const normalized_arr = []
                                        const existing_cols = []
                                        const colors_to_be_added = []

                                        for (const color of respJSON) {
                                            const { node_name, id } = color

                                            const node_name_lower = node_name.toLowerCase().trim()
                                            normalized_arr.push(node_name_lower)
                                            existing_cols.push({
                                                id: id,
                                                name: node_name
                                            })
                                        }

                                        existing_cols.findByName = (name) => {
                                            const _name = name.toLowerCase().trim()
                                            for (const ec of existing_cols) {
                                                const __name = ec.name.toLowerCase().trim()
                                                if (_name === __name) {
                                                    return ec
                                                }
                                            }
                                        }


                                        /*//3. Normalize requesting color array (remove duplicates)
                                        const unique_colors = [...new Map(req.body.gmt_array.map(i => [i.color.toLowerCase().trim(), i])).values()]*/

                                        const unique_colors = []
                                        unique_colors.contains = (color, nrf) => {
                                            const _color = color.toLowerCase().trim()
                                            //const _nrf = nrf.toLowerCase().trim()
                                            for (const obj of unique_colors) {
                                                const __color = obj.color.toLowerCase().trim()
                                                //const __nrf = obj.color.toLowerCase().trim()

                                                if (_color === __color) {
                                                    return true
                                                }
                                            }
                                            return false
                                        }
                                        unique_colors.add = (color, nrf) => {
                                            if (!unique_colors.contains(color, nrf)) {
                                                unique_colors.push({
                                                    color: color,
                                                    nrf: nrf
                                                })
                                            }
                                        }

                                        for (const gmt_col of gmt_filtered_array) {
                                            unique_colors.add(gmt_col.color, gmt_col.nrf)
                                        }

                                        //4. Check the colors to be added to the color Lobrary
                                        for (const color of unique_colors) {

                                            const color_low = color.color.toLowerCase().trim()
                                            if (!normalized_arr.includes(color_low)) {
                                                colors_to_be_added.push({ color: color.color.trim(), nrf: color.nrf })
                                            } else {
                                                const col = existing_cols.findByName(color_low)
                                                response.existed.push(
                                                    {
                                                        color_code: col.id,
                                                        color_name: col.name
                                                    }
                                                )
                                                response.totalExist++
                                            }
                                        }



                                        const num_cols_to_be_added = colors_to_be_added.length

                                        response.totalGMT = num_cols_to_be_added

                                        console.log(`Total Colors to Add : ${num_cols_to_be_added}`)
                                        console.log('Adding Colors!')



                                        if (num_cols_to_be_added == 0) {
                                            response.errors.push('All these colors are in the color spec!')
                                            response.totalErrors++
                                            return res.json(response)
                                        }

                                        function add_gmt_cols(gmt) {
                                            const gmt_col = gmt.pop()

                                            console.log(`Adding GMT ${JSON.stringify(gmt_col)}`)

                                            const add_gmt_col_req = {
                                                node_name: gmt_col.color,
                                                code: gmt_col.nrf,
                                                bx_color_print: 'Garment',
                                                bx_source_type: 'Customer',
                                                bx_nrf_code: gmt_col.nrf,
                                                bx_color_bank: 'ATLAS',
                                                bx_customer: customerID,
                                                bx_supplier: 'C140525' //need to hardcode this one for now. Because, though we add GMT color, and GMT color is for customer, this request body asks for the supplier as well. So, until this fixed from PLM side, Renzie told us to use this supplier code for now.
                                            }

                                            got.post('https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/color_specifications', { headers: { cookie: req.tokenCookie }, json: add_gmt_col_req })
                                                .then(
                                                    (success) => {
                                                        response.totalSuccess++
                                                        const sj = JSON.parse(success.body)

                                                        response.successes.push({
                                                            color_code: sj.id,
                                                            color_name: sj.node_name,
                                                        })



                                                        return
                                                    },
                                                    (rejected) => {
                                                        response.totalErrors++
                                                        response.errors.push(`Error when adding color ${add_gmt_col_req.node_name}. Reason : PLM error code ${rejected.response.statusCode}.`)

                                                        return
                                                    },

                                                ).catch(
                                                    (issue) => {
                                                        return res.status(500).json({ error: 'An error occurred when adding GMT colors to Color Spec!' })
                                                    }
                                                )
                                                .then(
                                                    () => {
                                                        if (gmt.length > 0) {
                                                            add_gmt_cols(gmt);
                                                        } else {
                                                            return res.status(200).json(response)
                                                        }
                                                    }
                                                )

                                        }

                                        add_gmt_cols(colors_to_be_added)





                                        /*(async () => {
                                            try {
                                                console.log('Adding Colors!')
                                                for (const adding_color of colors_to_be_added) {
                                                    const add_gmt_col_req = {
                                                        node_name: adding_color.color,
                                                        code: adding_color.nrf,
                                                        bx_color_print: 'Garment',
                                                        bx_source_type: 'Customer',
                                                        bx_nrf_code: adding_color.nrf,
                                                        bx_color_bank: 'ATLAS',
                                                        bx_customer: customerID,
                                                        bx_supplier: 'C140525' //need to hardcode this one for now. Because, though we add GMT color, and GMT color is for customer, this request body asks for the supplier as well. So, until this fixed from PLM side, Renzie told us to use this supplier code for now.
                                                    }
                                                    //console.log(`Adding ${adding_color.color}`)
                                                    //console.log(add_gmt_col_req);
            
                                                    const resp = await got.post('https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/color_specifications', { headers: { cookie: req.tokenCookie }, json: add_gmt_col_req });
                                                    console.log(resp.statusCode)
            
                                                    if (resp.statusCode == 201) {
                                                        response.totalSuccess++;
                                                    } else {
                                                        response.totalFail++;
                                                    }
            
            
            
            
            
                                                }
                                                return res.status(200).json(response)
            
                                            } catch (err) {
            
                                            }
            
                                        })()*/
                                    },
                                    (rejected) => {
                                        console.log('rej')
                                    }
                                ).catch(issue => {
                                    console.log(issue)
                                })
                        },
                        (rejected) => {
                            if (rejected.response.statusCode == 404) {
                                return res.status(404).json({ error: 'Customer Not Found!' })
                            } else {
                                return res.status(rejected.response.statusCode).json({ error: rejected.response.body })
                            }

                        }
                    )
                    .catch(issue => {
                        console.log('i')
                        return res.sendStatus(500)
                    })
            })
            colorRouter.post('/rm', (req, res) => {
                const response = {}
                const supp_lookup = []

                response.errors = []
                response.success = []
                response.existed = []
                response.totalErrors = 0
                response.totalSuccess = 0
                response.totalRM = 0

                console.log('Basic Validation - RM')
                if (!(req.body.customerId)) {
                    return res.status(400).json({ error: 'Customer ID is required!' })
                }
                if (!(req.body.rm_array)) {
                    return res.status(400).json({ error: 'RM Color array is required!' })
                }
                if (!(req.body.rm_array instanceof Array)) {
                    return res.status(400).json({ error: 'RM Colors must be an array!' })
                }
                if (req.body.rm_array.length == 0) {
                    return res.status(400).json({ error: 'RM Color array has no elements!' })
                }

                const rm_filtered_array = []

                rm_filtered_array.contains = (color, code, supplier) => {
                    const _color = color.toLowerCase().trim()
                    const _code = String(code).toLowerCase().trim()
                    const _supplier = supplier.toLowerCase().trim()
                    for (const obj of rm_filtered_array) {
                        const __color = obj.color.toLowerCase().trim()
                        const __code = String(obj.code).toLowerCase().trim()
                        const __supplier = obj.supplier.toLowerCase().trim()

                        if (_color === __color && _code === __code && _supplier === __supplier) {
                            return true
                        }
                    }
                    return false
                }

                rm_filtered_array.add = (color, code, supplier) => {
                    if (!rm_filtered_array.contains(color, code, supplier)) {
                        rm_filtered_array.push({
                            color: color,
                            code: code,
                            supplier: supplier
                        })
                    }
                }

                for (const indx in req.body.rm_array) {
                    const rm_info = req.body.rm_array[indx]
                    if (!rm_info.color) {
                        response.errors.push(`Missing RM color name in line ${indx} on LD Chart`)
                    }
                    if (!rm_info.code) {
                        response.errors.push(`Missing RM color code in line ${indx} on LD Chart`)
                    }
                    if (!rm_info.supplier) {
                        response.errors.push(`Missing RM color supplier in line ${indx} on LD Chart`)

                    }
                    if (!rm_info.color || !rm_info.code || !rm_info.supplier) {
                        response.totalErrors += 1
                        continue
                    }

                    rm_filtered_array.add(
                        rm_info.color,
                        rm_info.code,
                        rm_info.supplier
                    )
                }
                const customerID = req.body.customerId



                console.log('Checking customer on RM')
                got.get(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/customers/${customerID}`, { headers: { cookie: req.tokenCookie } })
                    .then(
                        (success) => {
                            console.log('Checking suppliers are available!')
                            let append = '?node_name='
                            const added_supplies = []
                            for (const rm_info of rm_filtered_array) {
                                if (!added_supplies.includes(rm_info.supplier.toLowerCase().trim())) {
                                    const supp_url = rm_info.supplier.replaceAll(' ', '%20')
                                    append += `${supp_url}&node_name=`
                                    added_supplies.push(rm_info.supplier.toLowerCase().trim())
                                }
                            }
                            append = append.substring(0, append.length - '&node_name='.length)
                            got.get(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/suppliers${append}`, { headers: { cookie: req.tokenCookie } })
                                .then(
                                    (success) => {
                                        const respJSON = JSON.parse(success.body)

                                        for (const sup of respJSON) {
                                            supp_lookup.push({
                                                id: sup.id,
                                                name: sup.node_name
                                            }
                                            )

                                        }
                                        console.log('Ommitting colors with non-existant suppliers')
                                        const colors_with_valid_suppliers = []
                                        for (const rm_col of rm_filtered_array) {
                                            let _supplier_found = false
                                            for (const _sup of supp_lookup) {
                                                if (rm_col.supplier.toLowerCase().trim() === _sup.name.toLowerCase().trim()) {
                                                    _supplier_found = true
                                                    rm_col.supplierId = _sup.id


                                                    break
                                                }
                                            }
                                            if (_supplier_found) {
                                                colors_with_valid_suppliers.push(rm_col)
                                            } else {
                                                response.totalErrors++;
                                                response.errors.push(`Skipping RM color '${rm_col.color}' with code '${rm_col.code}' because supplier '${rm_col.supplier}' not exist in PLM!`)
                                            }
                                        }
                                        console.log('Checking RM colors in color library in PLM')
                                        if (colors_with_valid_suppliers.length == 0) {
                                            return res.status(400).json({ error: 'No more RM colors to Add!' })
                                        } else {
                                            /*append = '?node_name='
                                            const _added = []
                                            for (const _rm of colors_with_valid_suppliers) {
                                                if (!_added.includes(_rm.color.toLowerCase().trim())) {
                                                    const rm_name = _rm.color.replaceAll(' ', '%20').replaceAll('+', '%2B').trim()
                                                    append += `${rm_name}&node_name=`
                                                    _added.push(_rm.color.toLowerCase().trim())
                                                }
                                            }
                                            append = append.substring(0, append.length - '&node_name='.length)
                                            console.log(append)*/
                                            const rm_colors_to_be_added = []
                                            rm_colors_to_be_added.exist = (color, code, supplier) => {
                                                const _col = color.toLowerCase().trim()
                                                const _cod = code.toLowerCase().trim()
                                                const _sup = supplier.trim()

                                                for (const _ci of rm_colors_to_be_added) {
                                                    const __col = _ci.color.toLowerCase().trim()
                                                    const __cod = _ci.code.toLowerCase().trim()
                                                    const __sup = _ci.supplierId.trim()

                                                    if (_col === __col && _cod === __cod && _sup === __sup) {
                                                        return true
                                                    }
                                                }
                                                return false
                                            }
                                            rm_colors_to_be_added.add = (color, code, supplier, supplier_name) => {
                                                if (!rm_colors_to_be_added.exist(color, code, supplier)) {
                                                    rm_colors_to_be_added.push({
                                                        color: color,
                                                        code: code,
                                                        supplierId: supplier,
                                                        supplier_name: supplier_name
                                                    })
                                                }
                                            }
                                            got.get(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/color_specifications?limit=0&bx_color_print=Color&bx_source_type=Supplier`, { headers: { cookie: req.tokenCookie } })
                                                .then(
                                                    (success) => {
                                                        const respJSON = JSON.parse(success.body)
                                                        for (const ldc_rm of colors_with_valid_suppliers) {
                                                            let color_found_in_plm = false
                                                            let c_rm = undefined
                                                            for (const plm_rm of respJSON) {

                                                                if (plm_rm.node_name.toLowerCase().trim() === ldc_rm.color.toLowerCase().trim() && plm_rm.bx_color_print.trim().toLowerCase() === 'color' && plm_rm.bx_source_type.trim().toLowerCase() === 'supplier' && plm_rm.bx_supplier.trim() === ldc_rm.supplierId.trim()) {
                                                                    color_found_in_plm = true
                                                                    let already_added_to_exist = false
                                                                    for (const exist_rm_color of response.existed) {
                                                                        if (exist_rm_color.color_id === plm_rm.id && exist_rm_color.color_name === plm_rm.node_name && exist_rm_color.supplier.id === ldc_rm.supplierId && exist_rm_color.supplier.name === ldc_rm.supplier) {
                                                                            already_added_to_exist = true
                                                                            break
                                                                        }
                                                                    }
                                                                    if (!already_added_to_exist) {
                                                                        response.existed.push({
                                                                            color_id: plm_rm.id,
                                                                            color_name: plm_rm.node_name,
                                                                            color_code: plm_rm.code,
                                                                            supplier: {
                                                                                id: ldc_rm.supplierId,
                                                                                name: ldc_rm.supplier
                                                                            }
                                                                        })
                                                                    }

                                                                    break
                                                                } else {
                                                                    c_rm = ldc_rm
                                                                }

                                                            }
                                                            if (!color_found_in_plm && c_rm) {

                                                                rm_colors_to_be_added.add(c_rm.color, c_rm.code, c_rm.supplierId, c_rm.supplier)
                                                            }

                                                        }


                                                        response.totalRM = rm_colors_to_be_added.length


                                                        if (rm_colors_to_be_added.length > 0) {




                                                            add_colors(rm_colors_to_be_added)

                                                            function add_colors(rm) {

                                                                const rm_clr = rm.pop()
                                                                console.log(`Adding RM Color : ${JSON.stringify(rm_clr)}`)



                                                                const add_rm_col_req = {
                                                                    node_name: rm_clr.color,
                                                                    code: rm_clr.code,
                                                                    bx_color_print: 'Color',
                                                                    bx_source_type: 'Supplier',
                                                                    bx_color_bank: 'ATLAS',
                                                                    bx_customer: customerID, //though this is not a required parameter in the requirement, this parameter is mandatory in PLM API
                                                                    bx_supplier: rm_clr.supplierId
                                                                }

                                                                got.post('https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/color_specifications', { headers: { cookie: req.tokenCookie }, json: add_rm_col_req })
                                                                    .then(
                                                                        (success) => {
                                                                            const successJSON = JSON.parse(success.body)
                                                                            response.totalSuccess++
                                                                            response.success.push({
                                                                                color_id: successJSON.id,
                                                                                color_name: successJSON.node_name,
                                                                                color_code: successJSON.code,
                                                                                supplier: {
                                                                                    id: rm_clr.supplierId,
                                                                                    name: rm_clr.supplier_name
                                                                                }

                                                                            })

                                                                            return

                                                                        },

                                                                        (issue) => {
                                                                            response.totalSuccess++;
                                                                        }
                                                                    )
                                                                    .catch(
                                                                        (issue) => {
                                                                            throw issue
                                                                        }
                                                                    ).then(
                                                                        () => {
                                                                            if (rm.length == 0) {
                                                                                return res.json(response)
                                                                            } else {
                                                                                add_colors(rm)
                                                                            }
                                                                        }
                                                                    )
                                                            }
                                                        } else {
                                                            response.errors.push('All the RM colors and relevant suppliers, codes are already in PLM!')
                                                            response.totalErrors++
                                                            return res.json(response)
                                                        }
                                                    },
                                                    (rejected) => {
                                                        console.log('rej')
                                                    }
                                                )
                                                .catch(
                                                    (issue) => {
                                                        console.error(issue)
                                                        return res.status(500).json({ error: 'Error occured on retrieving RM colors from color library from PLM!' })
                                                    }
                                                )
                                        }
                                    },
                                    (rejected) => {
                                        console.log('rej')
                                    },
                                    (issue) => {
                                        return res.status(500).json({ error: 'Error occured when retrieving supplier to add RM colors!' })
                                    }
                                )

                        },
                        (rejected) => {
                            if (rejected.response.statusCode == 404) {
                                return res.status(404).json({ error: 'Customer Not Found!' })
                            }
                        }
                    )
                    .catch(
                        (issue) => {
                            return res.status(500).json({ error: 'Error occured when retriving customer when adding RM colors!' })
                        }
                    )
            })

            bomRouter.post('/colorways/:style_id', (req, res) => {
                const allColorways = []
                console.log('Basic Validation!')

                if (!(req.body)) {
                    return res.status(400).json({ error: 'Garment colors are required!' })
                }
                if (!(req.body.silhouette)) {
                    return res.status(400).json({ error: 'Silhouette type is required!' })
                }
                if (!(req.body.gmt_array instanceof Array)) {
                    return res.status(400).json({ error: 'Request must be an array!' })
                }
                if (req.body.gmt_array.length == 0) {
                    return res.status(400).json({ error: 'Array has no elements!' })
                }

                for (const gmt_col of req.body.gmt_array
                ) {
                    const { color_code, color_name } = gmt_col
                    if (!color_code || !color_name) {
                        return res.status(400).json({ error: 'Invalid GMT Specification Array! Please check.' })
                    }
                }


                const sid = req.params.style_id.trim()
                const silhouette = req.body.silhouette.trim()

                if (!sid) {
                    return res.status(400).json({ error: 'Style ID required!' })
                }

                console.log('Checking silhouette exist!')
                got.get('https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/enum_lists?node_name=bxSilhoutte', { headers: { cookie: req.tokenCookie } })
                    .then(
                        (success) => {
                            const resp = JSON.parse(success.body)[0]
                            const silIDs = resp.values
                            let appender = "?id="
                            for (const sid of silIDs) {
                                appender += `${sid}&id=`
                            }
                            appender = appender.substring(0, appender.length - '&id='.length)
                            got.get(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/enum_values${appender}`, { headers: { cookie: req.tokenCookie } })
                                .then(
                                    success => {
                                        const resp = JSON.parse(success.body)
                                        let silFound = false

                                        for (const sil of resp) {
                                            let { node_name } = sil
                                            if (node_name.toLowerCase().trim() === silhouette.trim().toLowerCase()) {
                                                silFound = true
                                                break
                                            }
                                        }

                                        if (!silFound) {
                                            return res.status(404).json({ error: 'Specified Silhouette not found!' })
                                        }


                                        console.log('Checking weather the style exist!')
                                        got.get(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/styles/${sid}`, { headers: { cookie: req.tokenCookie } })
                                            .then(
                                                () => {
                                                    console.log('Retriving existing colorways')
                                                    got.get(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/colorways?style=${sid}&limit=0`, { headers: { cookie: req.tokenCookie } })
                                                        .then(
                                                            success => {
                                                                const resp = JSON.parse(success.body)
                                                                const adding_cw = []
                                                                let addedColorWays = 0
                                                                let existedColorWays = 0
                                                                for (const gmt of req.body.gmt_array) {
                                                                    const { color_name } = gmt
                                                                    let colFound = false
                                                                    for (const { node_name, id } of resp) {
                                                                        if (color_name.toLowerCase().trim() === node_name.toLowerCase().trim()) {
                                                                            existedColorWays++
                                                                            allColorways.push({
                                                                                id: id,
                                                                                name: node_name,
                                                                            })
                                                                            colFound = true
                                                                            break
                                                                        }
                                                                    }
                                                                    if (!colFound) {
                                                                        adding_cw.push(gmt)
                                                                    }
                                                                }
                                                                console.log(`Adding colorways to style ${sid}`)
                                                                function add_cw_to_style(arr) {
                                                                    if (arr.length > 0) {
                                                                        const col = arr.pop()
                                                                        console.log(`Adding ${JSON.stringify(col)}`)
                                                                        got.post(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/styles/${sid}/product_colors`, {
                                                                            headers: { cookie: req.tokenCookie }, json: {
                                                                                node_name: col.color_name,
                                                                                bx_silhouette: silhouette,
                                                                                color_specification: col.color_code
                                                                            }
                                                                        })
                                                                            .then(
                                                                                (success) => {
                                                                                    const resp = JSON.parse(success.body)
                                                                                    const { id, node_name } = resp
                                                                                    allColorways.push({
                                                                                        id: id,
                                                                                        name: node_name
                                                                                    })
                                                                                    addedColorWays++
                                                                                    add_cw_to_style(arr)
                                                                                },
                                                                                (rejected) => {
                                                                                    console.error(rejected)
                                                                                    return res.sendStatus(400)
                                                                                }
                                                                            ).catch(
                                                                                (e) => {
                                                                                    console.error(e)
                                                                                    return res.status(500).json({ error: 'Error occurred while adding colorways to the style' })
                                                                                }
                                                                            )

                                                                    } else {
                                                                        return res.json({
                                                                            color_ways: allColorways,
                                                                            existed_colorways: existedColorWays,
                                                                            added_colorways: addedColorWays
                                                                        })
                                                                    }
                                                                }
                                                                add_cw_to_style(adding_cw)


                                                            },
                                                            rejected => {
                                                                return res.sendStatus(400)
                                                            }

                                                        )
                                                        .catch(
                                                            (e) => {
                                                                console.error(e)
                                                                return res.status(500).json({ error: 'Error occurred during querying existing colorways!' })
                                                            }
                                                        )
                                                },
                                                (rejected) => {
                                                    if (rejected.response.statusCode == 404) {
                                                        return res.status(404).json({ error: 'Style not found!' })
                                                    }
                                                    return res.sendStatus(rejected.response.statusCode)
                                                }
                                            )
                                            .catch(ex => {
                                                return res.status(500).json({ error: 'Error occurred during querying style!' })
                                            })

                                    },
                                    rejected => {
                                        console.error(rejected)
                                        return res.sendStatus(400)
                                    }
                                )
                                .catch(
                                    error => {
                                        console.error(error)
                                        return res.status(500).json({ error: 'Error occurred during Silhoutte Names!' })
                                    }
                                )
                        },
                        (rejected) => {
                            console.error(rejected)
                            return res.sendStatus(400)
                        }
                    ).catch(
                        (err) => {
                            console.error(err)
                            return res.status(500).json({ error: 'Error occurred during Silhoutte IDs!' })
                        }
                    )
            })
            bomRouter.post('/:style_id/:bom_id/gmt', (req, res) => {
                const bid = req.params.bom_id
                const sid = req.params.style_id
                console.log('Basic validation')
                if (!req.body) {
                    return res.status(400).json({ error: 'Colorway ID array is not present!' })
                }
                if (!(req.body instanceof Array)) {
                    return res.status(400).json({ error: 'Invalid colorway ID array!' })
                }
                if (req.body.length == 0) {
                    return res.status(400).json({ error: 'Colorway ID array has no elements!' })
                }
                if (!sid) {
                    return res.status(400).json({ error: 'Style ID is invalid or not specified!' })
                }
                if (!bid) {
                    return res.status(400).json({ error: 'BOM ID is invalid or not specified!' })
                }
                console.log('Check whether Style exist!')
                got.get(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/styles/${sid}`, { headers: { cookie: req.tokenCookie } })
                    .then(
                        () => {
                            console.log('Check weather BOM exist!')
                            got.get(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/apparel_boms/${bid}`, { headers: { cookie: req.tokenCookie } })
                                .then(
                                    (success) => {
                                        const resp = JSON.parse(success.body)
                                        const { latest_revision } = resp

                                        console.log(`Adding GMT colors to BOM. Latest revision is ${latest_revision}`)
                                        got.put(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/apparel_bom_revisions/${latest_revision}/`, {
                                            headers: { cookie: req.tokenCookie }, json: {
                                                bom_product_colors: req.body
                                            }
                                        }).json()
                                            .then(
                                                (success) => {

                                                    return res.status(201).json({ color_vector: success.bom_product_colors })
                                                },
                                                () => {
                                                    return res.status(400).json({ error: 'Unable to process. Please check the GMT ID array.' })
                                                }
                                            )
                                            .catch(
                                                (e) => {
                                                    console.error(e)
                                                    return res.status(500).json({ error: 'An error occurred when adding GMT to BOM!' })
                                                }
                                            )
                                    },
                                    rejected => {
                                        if (rejected.response.statusCode == 404) {
                                            return res.status(404).json({ error: 'BOM not found!' })
                                        } else {
                                            return res.sendStatus(400)
                                        }
                                    }
                                ).catch(
                                    () => {
                                        return res.status(500).json({ error: 'An error occurred while checking existance on BOM!' })
                                    }
                                )
                        },
                        rejected => {
                            if (rejected.response.statusCode == 404) {
                                return res.status(404).json({ error: 'Style not found!' })
                            } else {
                                return res.sendStatus(400)
                            }
                        }
                    )
                    .catch(
                        (e) => {
                            console.error(e)
                            return res.status(500).json({ error: 'An error occurred while checking existance on style!' })
                        }
                    )
            })
            bomRouter.post('/:style_id/:bom_id/rm/material', (req, res) => {
                const bid = req.params.bom_id
                const sid = req.params.style_id

                console.log('Basic validation')
                if (!req.body) {
                    return res.status(400).json({ error: 'Invalid request!' })
                }
                if (!req.body.reference_array) {
                    return res.status(400).json({ error: 'Reference array is required!' })
                }
                if (!req.body.rm_colors) {
                    return res.status(400).json({ error: 'RM color array is required!' })
                }
                if (!req.body.color_ways) {
                    return res.status(400).json({ error: 'Colorways array is required!' })
                }
                if (!(req.body.reference_array instanceof Array)) {
                    return res.status(400).json({ error: 'Invalid reference array!' })
                }
                if (!(req.body.rm_colors instanceof Array)) {
                    return res.status(400).json({ error: 'Invalid RM color array!' })
                }
                if (!(req.body.color_ways instanceof Array)) {
                    return res.status(400).json({ error: 'Invalid colorways array!' })
                }
                if (req.body.reference_array.length == 0) {
                    return res.status(400).json({ error: 'Reference array has no elements!' })
                }
                if (req.body.rm_colors.length == 0) {
                    return res.status(400).json({ error: 'RM color array has no elements!' })
                }
                if (req.body.color_ways.length == 0) {
                    return res.status(400).json({ error: 'Colorways array has no elements!' })
                }
                if (!sid) {
                    return res.status(400).json({ error: 'Style ID is invalid or not specified!' })
                }
                if (!bid) {
                    return res.status(400).json({ error: 'BOM ID is invalid or not specified!' })
                }

                const ref_arr = req.body.reference_array
                const rm_arr = req.body.rm_colors
                const gm_colorway = req.body.color_ways

                for (const rm_elm of rm_arr) {
                    const { color_id, color_name, color_code, supplier } = rm_elm
                    const { id, name } = supplier

                    if (!color_id || !color_name || !color_code || !supplier || !id || !name) {
                        return res.status(400).json({ error: 'Invalid RM Color Array! Please check.' })
                    }
                }



                got.get(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/styles/${sid}`, { headers: { cookie: req.tokenCookie } })
                    .then(
                        () => {
                            got.get(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/apparel_boms/${bid}`, { headers: { cookie: req.tokenCookie } })
                                .then(
                                    (success) => {
                                        const respJSON = JSON.parse(success.body)
                                        const { latest_revision } = respJSON
                                        //1. Latest BOM revision
                                        console.log('1')
                                        got.get(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/apparel_bom_revisions/${latest_revision}`, { headers: { cookie: req.tokenCookie } })
                                            .then(
                                                (success) => {
                                                    const respJSON = JSON.parse(success.body)
                                                    const { items } = respJSON

                                                    let appender = '?id='
                                                    for (const item of items) {
                                                        appender += `${item}&id=`
                                                    }
                                                    appender = appender.substring(0, appender.length - '&id='.length)
                                                    //2. Get All the information regarding items from latest BOM revision
                                                    console.log('2')
                                                    got.get(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/part_materials${appender}`, { headers: { cookie: req.tokenCookie } })
                                                        .then(
                                                            (success) => {
                                                                const respJSON = JSON.parse(success.body)
                                                                const part_item_info = []
                                                                let appender = '?id='
                                                                for (const part_item of respJSON) {
                                                                    const part_info = {}
                                                                    part_info.item = {}
                                                                    part_info.item.id = part_item.id
                                                                    part_info.item.node_name = part_item.node_name
                                                                    part_info.item.actual = part_item.actual
                                                                    part_info.item.bom_line_quote = part_item.bom_line_quote

                                                                    part_item_info.push(part_info)
                                                                    appender += `${part_item.bom_line_quote}&id=`
                                                                }
                                                                appender = appender.substring(0, appender.length - '&id='.length)
                                                                //3. Latest revision of supplier quote
                                                                console.log('3')
                                                                got.get(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/supplier_items${appender}`, { headers: { cookie: req.tokenCookie } })
                                                                    .then(
                                                                        async (success) => {
                                                                            const respJSON = JSON.parse(success.body)
                                                                            let appender = '?id='
                                                                            for (const s_quote of respJSON) {
                                                                                const { id, latest_revision, node_name, bx_supplier } = s_quote
                                                                                appender += `${latest_revision}&id=`
                                                                                for (const part_item of part_item_info) {
                                                                                    const { item } = part_item
                                                                                    const { bom_line_quote } = item
                                                                                    if (bom_line_quote.toLowerCase().trim() === id.toLowerCase().trim()) {
                                                                                        part_item.supplier_info = {}
                                                                                        part_item.supplier_info.latest_revision = latest_revision
                                                                                        part_item.supplier_info.supplier_name = node_name;
                                                                                        //3.1 Get Actual Supplier
                                                                                        const [parent_supp] = await got.get(`${suppliers}?id=${bx_supplier}`, { headers: { cookie: req.tokenCookie } }).json()
                                                                                        const { id } = parent_supp
                                                                                        part_item.supplier_info.parent = {}
                                                                                        part_item.supplier_info.parent.id = id
                                                                                        part_item.supplier_info.parent.name = parent_supp.node_name
                                                                                    }
                                                                                }
                                                                            }
                                                                            appender = appender.substring(0, appender.length - '&id='.length)
                                                                            //4. Matvh Placement and color dying technique
                                                                            console.log('4')
                                                                            got.get(`https://brandix-test.centricsoftware.com/csi-requesthandler/api/v2/supplier_item_revisions${appender}`, { headers: { cookie: req.tokenCookie } })
                                                                                .then(
                                                                                    async (success) => {
                                                                                        const respJSON = JSON.parse(success.body)
                                                                                        for (const sup_quote of respJSON) {
                                                                                            const { id, bx_color_base_1, bx_color_dyeing_technique } = sup_quote
                                                                                            for (const part_info of part_item_info) {
                                                                                                const { supplier_info } = part_info
                                                                                                const { latest_revision } = supplier_info

                                                                                                if (id.toLowerCase().trim() === latest_revision.toLowerCase().trim()) {
                                                                                                    part_info.rm_info = {}
                                                                                                    part_info.rm_info.color_base = bx_color_base_1
                                                                                                    part_info.rm_info.color_dying_technique = bx_color_dyeing_technique
                                                                                                }
                                                                                            }

                                                                                        }
                                                                                        const item_color_info_full = []
                                                                                        const errors = []
                                                                                        for (const pi of part_item_info) {

                                                                                            const { item } = pi
                                                                                            const { node_name, actual } = item

                                                                                            for (const ref_elm of ref_arr) {
                                                                                                const { rm_color_placement } = ref_elm

                                                                                                const _node_name = String(node_name).toLowerCase().trim()
                                                                                                const _rm_color_placement = String(rm_color_placement).toLowerCase().trim()

                                                                                                if (_node_name === _rm_color_placement) {
                                                                                                    //console.log('Placement Match!')
                                                                                                    const { rm_color_cdt } = ref_elm
                                                                                                    const _rm_color_cdt = rm_color_cdt.trim().toLowerCase()
                                                                                                    if (_rm_color_cdt) {
                                                                                                        //check the color_dying_technique
                                                                                                        let mappingFound = false
                                                                                                        let _plm_cdt = ''
                                                                                                        for (const mapping of cdt_map) {
                                                                                                            if (mapping.ldc.trim().toLowerCase() === _rm_color_cdt) {
                                                                                                                mappingFound = true
                                                                                                                _plm_cdt = mapping.plm
                                                                                                                break
                                                                                                            }
                                                                                                        }
                                                                                                        if (!mappingFound) {
                                                                                                            errors.push(`LDC row ${ref_elm.reference_index} is skipped because CDT mapping does not exist!`)
                                                                                                            continue
                                                                                                        } else {
                                                                                                            if (_plm_cdt.toLowerCase().trim() !== pi.rm_info.color_base.toLowerCase().trim()) {
                                                                                                                continue
                                                                                                            }
                                                                                                        }
                                                                                                    } else {
                                                                                                        const errDisp = `Skipped color dying technique check on LDC ROW ${ref_elm.reference_index} because CDT is empty!`
                                                                                                        if (!errors.includes(errDisp)) {
                                                                                                            errors.push(errDisp)
                                                                                                        }

                                                                                                    }

                                                                                                    const { rm_color, rm_color_code, rm_color_supplier, gmt_color, gmt_color_code } = ref_elm

                                                                                                    const _rm_color_supplier = rm_color_supplier.toLowerCase().trim()
                                                                                                    const { supplier_info } = pi
                                                                                                    const { parent } = supplier_info
                                                                                                    const { name } = parent
                                                                                                    const _supplier_name = name.toLowerCase().trim()



                                                                                                    if (_rm_color_supplier === _supplier_name) {
                                                                                                        console.log('Sup match!')
                                                                                                        console.log(`GMT Color is ${gmt_color}`)
                                                                                                        console.log(`RM color is ${rm_color}`)
                                                                                                        console.log(`actual is ${actual}`)
                                                                                                        //query the RM color from RM Array with RM name and Supplier!

                                                                                                        for (const rm_color_elm of rm_arr) {
                                                                                                            const { color_id, color_name, color_code, supplier } = rm_color_elm
                                                                                                            const { id, name } = supplier
                                                                                                            const _color_name = color_name.toLowerCase().trim()
                                                                                                            const _color_code = color_code.toLowerCase().trim()

                                                                                                            const _sup_name = name.toLowerCase().trim()

                                                                                                            const _rm_color = rm_color.toLowerCase().trim()
                                                                                                            const _rm_color_code = rm_color_code.toLowerCase().trim()

                                                                                                            if (_color_name === _rm_color && _color_code === _rm_color_code && _rm_color_supplier === _sup_name) {
                                                                                                                console.log(`Found the row ${JSON.stringify(rm_color_elm)}`)
                                                                                                                //find gm color way from it's array!
                                                                                                                let gm_cw_id = ""
                                                                                                                const hide_for_gm = []

                                                                                                                for (const color_way of gm_colorway) {
                                                                                                                    const cw_id = color_way.id
                                                                                                                    const color_name = color_way.name
                                                                                                                    const _color_name = color_name.trim().toLowerCase()
                                                                                                                    const _gmt_color = gmt_color.trim().toLowerCase()

                                                                                                                    if (_color_name === _gmt_color) {
                                                                                                                        gm_cw_id = cw_id
                                                                                                                    } else {
                                                                                                                        hide_for_gm.push(cw_id)
                                                                                                                    }

                                                                                                                }
                                                                                                                let item_rm_color_material_id = ""
                                                                                                                let found = false
                                                                                                                try {
                                                                                                                    console.log(`Querying product colors (RM) for material ${actual}`)
                                                                                                                    const prod_cols = await got.get(`${materials}/${actual}/product_colors`, { headers: { cookie: req.tokenCookie } }).json()
                                                                                                                    for (const prod_col of prod_cols) {
                                                                                                                        const { id, color_specification } = prod_col
                                                                                                                        const cs = color_specification.trim().toLowerCase()
                                                                                                                        const _color_id = color_id.trim().toLowerCase()

                                                                                                                        if (cs === _color_id) {
                                                                                                                            found = true
                                                                                                                            item_rm_color_material_id = id
                                                                                                                            break
                                                                                                                        }

                                                                                                                    }

                                                                                                                    if (!found) {
                                                                                                                        //now add that
                                                                                                                        try {
                                                                                                                            console.log(`Adding RM Color to material ${actual}`)
                                                                                                                            const result = await got.post(`${materials}/${actual}/product_colors`, {
                                                                                                                                headers: { cookie: req.tokenCookie }, json: {
                                                                                                                                    node_name: color_name,
                                                                                                                                    color_specification: color_id
                                                                                                                                }
                                                                                                                            }).json()

                                                                                                                            const { id } = result
                                                                                                                            item_rm_color_material_id = id
                                                                                                                        } catch (error) {
                                                                                                                            return res.status(500).json({ error: `An error occurred while adding product colors for material ${actual}` })
                                                                                                                        }
                                                                                                                    }


                                                                                                                } catch (error) {
                                                                                                                    return res.status(500).json({ error: `An error occurred while querying product colors for material ${actual}` })
                                                                                                                }


                                                                                                                item_color_info_full.push({
                                                                                                                    item_placement: node_name,
                                                                                                                    item_part_material_id: item.id,
                                                                                                                    item_color_dying_technique_ldc: _rm_color_cdt,
                                                                                                                    item_color_dying_technique_plm: "",
                                                                                                                    item_rm_color_name: color_name,
                                                                                                                    item_rm_color_code: color_code,
                                                                                                                    item_rm_color_spec_id: color_id,
                                                                                                                    item_rm_color_supplier_name: name,
                                                                                                                    item_rm_color_supplier_id: id,
                                                                                                                    item_rm_color_actual_material: actual,
                                                                                                                    item_rm_color_material_id: item_rm_color_material_id,
                                                                                                                    item_gm_color_name: gmt_color,
                                                                                                                    item_gm_color_nrf: gmt_color_code,
                                                                                                                    item_gm_colorway_id: gm_cw_id,
                                                                                                                    item_gm_color_hide: hide_for_gm
                                                                                                                })
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }

                                                                                        return res.json({ processed_info: item_color_info_full, errors })

                                                                                    },
                                                                                    () => {
                                                                                        return res.status(400).json({ error: 'Error on color dying technique query!' })
                                                                                    }
                                                                                )
                                                                                .catch(
                                                                                    e => {
                                                                                        console.error(e)
                                                                                        return res.status(500).json({ error: 'An error occurred while querying color dying technique!' })
                                                                                    }
                                                                                )

                                                                        },
                                                                        () => {
                                                                            return res.status(400).json({ error: 'Error on latest supplier quote query!' })
                                                                        }
                                                                    ).catch(
                                                                        e => {
                                                                            console.error(e)
                                                                            return res.status(500).json({ error: 'An error occurred while querying latest supplier quote!' })
                                                                        }
                                                                    )


                                                            },
                                                            () => {
                                                                return res.status(400).json({ error: 'Error on part materials query!' })
                                                            }
                                                        )
                                                        .catch(
                                                            e => {
                                                                console.error(e)
                                                                return res.status(500).json({ error: 'An error occurred while querying part material info!' })
                                                            }
                                                        )
                                                },
                                                () => {
                                                    return res.status(400).json({ error: 'Error on latest BOM revision query!' })
                                                }
                                            ).catch(
                                                e => {
                                                    console.error(e)
                                                    return res.status(500).json({ error: 'An error occurred while quering BOM latest revision!' })
                                                }
                                            )

                                    },
                                    (rejected) => {
                                        if (rejected.response.statusCode == 404) {
                                            return res.status(404).json({ error: 'BOM not found!' })
                                        } else {
                                            return res.sendStatus(400)
                                        }
                                    }
                                )
                                .catch(
                                    e => {
                                        console.error(e)
                                        return res.status(500).json({ error: 'Error occurred when quering BOM existance!' })
                                    }
                                )
                        },
                        (rejected) => {
                            if (rejected.response.statusCode == 404) {
                                return res.status(404).json({ error: 'Style not found!' })
                            } else {
                                return res.sendStatus(400)
                            }
                        }
                    ).catch(
                        e => {
                            console.error(e)
                            return res.status(500).json({ error: 'Error occurred when quering style existance!' })
                        }
                    )

            })
            bomRouter.post('/:style_id/:bom_id/match', (req, res) => {
                if (!req.body.rm_gm) {
                    return res.status(400).json({ error: 'RM and GM information array is missing!' })
                }

                if (!req.body.rm_gm instanceof Array) {
                    return res.status(400).json({ error: 'Invalid RM and GM information array!' })
                }

                if (req.body.rm_gm.length == 0) {
                    return res.status(400).json({ error: 'RM and GM information array has no elements!' })
                }

                const rm_gm_array = req.body.rm_gm
                const sid = req.params.style_id
                const bid = req.params.bom_id

                for (const rm_gm of rm_gm_array) {
                    const keys = [
                        'item_placement',
                        'item_part_material_id',
                        'item_color_dying_technique_ldc',
                        'item_color_dying_technique_plm',
                        'item_rm_color_name',
                        'item_rm_color_code',
                        'item_rm_color_spec_id',
                        'item_rm_color_supplier_name',
                        'item_rm_color_supplier_id',
                        'item_rm_color_actual_material',
                        'item_rm_color_material_id',
                        'item_gm_color_name',
                        'item_gm_color_nrf',
                        'item_gm_colorway_id',
                        'item_gm_color_hide'
                    ]

                    for (const key of keys
                    ) {
                        if (!key in rm_gm) {
                            return res.status(400).json({ error: 'Invalid RM and GM Information array. Please check!' })
                        }
                    }
                }
                got.get(`${styles}/${sid}`, { headers: { cookie: req.tokenCookie } }).json()
                    .then(
                        () => {
                            got.get(`${boms}/${bid}`, { headers: { cookie: req.tokenCookie } }).json()
                                .then(
                                    (success) => {
                                        const { latest_revision } = success

                                        got.get(`${bom_revs}/${latest_revision}`, { headers: { cookie: req.tokenCookie } }).json()
                                            .then(
                                                async (success) => {

                                                    const { bom_product_colors } = success
                                                    const ret = []
                                                    for (const item_info of rm_gm_array) {
                                                        const color_way_vector = []
                                                        for (const bom_prod_col of bom_product_colors) {
                                                            if (item_info.item_gm_colorway_id === bom_prod_col) {
                                                                color_way_vector.push(item_info.item_rm_color_material_id)
                                                            } else {
                                                                color_way_vector.push('')
                                                            }
                                                        }
                                                        const hiding_vector = item_info.item_gm_color_hide
                                                        try {
                                                            console.log(`Setting up part material ${item_info.item_part_material_id}`)


                                                            const res = await got.put(`${part_materials}/${item_info.item_part_material_id}`,
                                                                {
                                                                    headers: { cookie: req.tokenCookie },
                                                                    json: {
                                                                        colorways_color: color_way_vector,
                                                                        hidden_for_color: hiding_vector
                                                                    }

                                                                }).json()
                                                            ret.push(
                                                                {
                                                                    part_material: item_info.item_part_material_id,
                                                                    result: res
                                                                })
                                                        } catch (ex) {

                                                            return res.status(500).json({ error: `An error occurred while matching GMT and RM for part material ${item_info.item_part_material_id}` })
                                                        }


                                                    }
                                                    return res.json(ret)
                                                },
                                                (rejected) => {
                                                    if (rejected.response.statusCode == 404) {
                                                        return res.status(404).json({ error: 'BOM Revision not found!' })
                                                    } else {
                                                        return res.sendStatus(400)
                                                    }
                                                }
                                            ).catch(
                                                (e) => {
                                                    console.error(e)
                                                    return res.status(500).json({ error: 'An error occurred while getting BOM\'s product colors!' })
                                                }
                                            )
                                    },
                                    (rejected) => {
                                        if (rejected.response.statusCode == 404) {
                                            return res.status(404).json({ error: 'BOM not found!' })
                                        } else {
                                            return res.sendStatus(400)
                                        }
                                    }
                                )
                                .catch(
                                    (e) => {
                                        console.error(e)
                                        return res.status(500).json({ error: 'An error occurred while checking BOM!' })
                                    }
                                )

                        },
                        (rejected) => {
                            if (rejected.response.statusCode == 404) {
                                return res.status(404).json({ error: 'Style not found!' })
                            } else {
                                return res.sendStatus(400)
                            }
                        }
                    ).catch(
                        (e) => {
                            console.error(e)
                            return res.status(500).json({ error: 'An error occurred while checking the style!' })
                        }
                    )
            })


            const HistoryHelper = {
                /**
                 * 
                 * @param {string} customerId 
                 * @param {(result: boolean, localError: string)=>void} result 
                 * @param {(ed:{error:string, db:any})=>void} error 
                 */
                checkCustomer: function (customerId, result, error) {
                    pool.query('SELECT COUNT(*) AS cnt FROM history_head WHERE customer_id_plm = ($1)', [customerId.trim()], (e, r) => {
                        if (e) {
                            return error({ error: 'Unable to retrieve customer for existance check!', db: e })
                        }
                        if (parseInt(r.rows[0].cnt) == 0) {
                            return result(false, 'History Customer not Found!')
                        } else {
                            return result(true)
                        }
                    })
                },

                /**
                 * 
                 * @param {string} customerId 
                 * @param {string} seasonId 
                 * @param {(result:boolean, localError:string)=>void} result 
                 * @param {(ed:{error:string, db:any})=>void} error 
                 */
                checkSeason: function (customerId, seasonId, result, error) {
                    this.checkCustomer(customerId, (bres, lerr) => {
                        if (!bres) {
                            return result(bres, lerr)
                        }
                        pool.query('SELECT COUNT(*) AS cnt FROM history_head WHERE customer_id_plm = $1 AND season_id_plm = $2', [
                            customerId.trim(),
                            seasonId.trim()
                        ], (e, r) => {
                            if (e) {
                                return error({ error: 'Unable to retrieve seasons for existance check!', db: e })
                            }
                            if (parseInt(r.rows[0].cnt) == 0) {
                                return result(false, 'Season not found!')
                            }
                            return result(true)
                        })
                    }, (e) => {
                        return error(e)
                    })
                },
                /**
                 * 
                 * @param {string} customerId 
                 * @param {string} seasonId 
                 * @param {string} styleId 
                 * @param {(result:boolean, localError:string)=>void} result 
                 * @param {(ed:{error:string, db:any})=>void} error 
                 */
                checkStyle: function (customerId, seasonId, styleId, result, error) {
                    this.checkSeason(customerId, seasonId, (bres, lerr) => {
                        if (!bres) {
                            return result(false, lerr)
                        }
                        pool.query('SELECT COUNT(*) AS cnt FROM history_head WHERE customer_id_plm = $1 AND season_id_plm = $2 AND style_id_plm = $3', [
                            customerId.trim(),
                            seasonId.trim(),
                            styleId.trim()
                        ], (e, r) => {
                            if (e) {
                                return error({ error: 'Unable to retrieve style for existance check!', db: e })
                            }
                            if (parseInt(r.rows[0].cnt) == 0) {
                                return result(false, 'Style not found!')
                            }
                            return result(true)
                        })
                    }, (err) => {
                        return error(err)
                    })
                },
                /**
                 * 
                 * @param {string} customerId 
                 * @param {string} seasonId 
                 * @param {string} styleId 
                 * @param {string} bomId 
                 * @param {(result:boolean, localError:string)=>void} result 
                 * @param {(ed:{error:string, db:any})=>void} error 
                 */
                checkBom: function (customerId, seasonId, styleId, bomId, result, error) {
                    this.checkStyle(customerId, seasonId, styleId, (bres, lerr) => {
                        if (!bres) {
                            return result(false, lerr)
                        }
                        pool.query('SELECT COUNT(*) AS cnt FROM history_head WHERE customer_id_plm = $1 AND season_id_plm = $2 AND style_id_plm = $3 AND bom_version_id_plm = $4', [
                            customerId.trim(),
                            seasonId.trim(),
                            styleId.trim(),
                            bomId.trim()
                        ], (e, r) => {
                            if (e) {
                                return error({ error: 'Unable to retrieve BOMs for existance check!', db: e })
                            }
                            if (parseInt(r.rows[0].cnt) == 0) {
                                return result(false, 'BOM not found!')
                            }
                            return result(true)
                        })
                    }, (err) => {
                        return error(err)
                    })
                },
                /**
                 * 
                 * @param {string} customerId 
                 * @param {string} seasonId 
                 * @param {string} styleId 
                 * @param {string} bomId 
                 * @param {number} slotId 
                 * @param {(result:boolean, localError: string) => void} result 
                 * @param {(ed:{error: string, db: any}) => void} error 
                 */
                checkUploadSlot: function (customerId, seasonId, styleId, bomId, slotId, result, error) {
                    this.checkBom(customerId, seasonId, styleId, bomId, (bres, lerr) => {
                        if (!bres) {
                            return result(false, lerr)
                        }
                        pool.query('SELECT COUNT(*) AS cnt FROM history_summary WHERE id = $1', [
                            parseInt(slotId)
                        ], (e, r) => {
                            if (e) {
                                return error({ error: 'Unable to retrieve history summary info!', db: e })
                            }
                            if (parseInt(r.rows[0].cnt) == 0) {
                                return result(false, 'No history summaries found!')
                            }
                            return result(true)
                        })
                    }, (e) => {
                        return error(e)
                    })
                }
            }

            historyRouter.post('/', (req, res) => {
                const hrq = req.body
                const req_top_keys = [
                    'customer_id_plm',
                    'customer_name',
                    'season_id_plm',
                    'season_name',
                    'style_id_plm',
                    'style_name',
                    'bom_version_id_plm',
                    'bom_version_name',
                    'success_summary',
                    'details',
                ]
                const sum_keys = [
                    'colorways_extracted',
                    'raw_material_extracted',
                    'colorways_added_to_the_library',
                    'raw_material_colors_added_to_the_library',
                    'colorways_added_to_plm_bom',
                    'raw_material_colors_added_to_plm_bom'
                ]
                const error_keys = [
                    'error_type',
                    'error_description',
                ]
                const detail_keys = [
                    'reference_index',
                    'rm_color',
                    'rm_color_code',
                    'rm_color_supplier',
                    'rm_color_placement',
                    'rm_color_cdt',
                    'gmt_color',
                    'gmt_color_code'
                ]

                for (const top_key of req_top_keys) {
                    if (!hrq.hasOwnProperty(top_key)) {
                        return res.status(400).json({ error: `Invalid request! ${top_key} is missing!` })
                    }
                }
                for (const summ_key of sum_keys) {
                    if (!hrq.success_summary.hasOwnProperty(summ_key)) {
                        return res.status(400).json({ error: `Invalid request! ${summ_key} is missing!` })
                    }
                }
                if (hrq.hasOwnProperty('errors')) {
                    if (!hrq.erros instanceof Array) {
                        return res.status(400).json({ error: 'Error list is not an array!' })
                    }
                    for (const error of hrq.errors) {
                        for (const err_key of error_keys) {
                            if (!error.hasOwnProperty(err_key)) {
                                return res.status(400).json({ error: `Invalid request! ${err_key} is missing!` })
                            }
                        }
                    }
                }
                if (!hrq.details instanceof Array) {
                    return res.status(400).json({ error: 'Detail list must be an array!' })
                }
                for (const detail_key of detail_keys
                ) {
                    for (const detail of hrq.details) {
                        if (!detail.hasOwnProperty(detail_key)) {
                            return res.status(400).json({ error: `Invalid request! ${detail_key} is missing one of the element id detail array!` })
                        }
                    }
                }
                const now = new Date()
                pool.query('BEGIN', (e, _) => {
                    if (e) {
                        return res.status(500).json({ error: 'Unable to begin Transaction!', db: e })
                    }
                    pool.query('SELECT id FROM history_head WHERE customer_id_plm = $1 AND season_id_plm = $2 AND style_id_plm = $3 AND bom_version_id_plm = $4',
                        [
                            hrq.customer_id_plm,
                            hrq.season_id_plm,
                            hrq.style_id_plm,
                            hrq.bom_version_id_plm,
                        ], (e, r) => {
                            if (e) {
                                pool.query('ROLLBACK')
                                return res.status(500).json({ error: 'Unable to check existance of given BOM info!', db: e })
                            }
                            if (r.rowCount > 0) {
                                insertHistorySummaryDetailsAndErrors(parseInt(r.rows[0].id))
                            } else {
                                pool.query('INSERT INTO history_head (customer_id_plm, customer_name, season_id_plm, season_name, style_id_plm, style_name, bom_version_id_plm, bom_version_name)VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id', [
                                    hrq.customer_id_plm,
                                    hrq.customer_name,
                                    hrq.season_id_plm,
                                    hrq.season_name,
                                    hrq.style_id_plm,
                                    hrq.style_name,
                                    hrq.bom_version_id_plm,
                                    hrq.bom_version_name
                                ], (e, r) => {
                                    if (e) {
                                        pool.query('ROLLBACK')
                                        return res.status(500).json({ error: 'Unable to insert to history head table!', db: e })
                                    }
                                    insertHistorySummaryDetailsAndErrors(parseInt(r.rows[0].id))
                                })
                            }
                        })
                })



                function insertHistorySummaryDetailsAndErrors(historyHeadID) {
                    const {
                        colorways_extracted,
                        raw_material_extracted,
                        colorways_added_to_the_library,
                        raw_material_colors_added_to_the_library,
                        colorways_added_to_plm_bom,
                        raw_material_colors_added_to_plm_bom } = hrq.success_summary

                    pool.query('INSERT INTO history_summary (history_head_id, colorways_extracted, raw_material_extracted, colorways_added_to_the_library, raw_material_colors_added_to_the_library, colorways_added_to_plm_bom, raw_material_colors_added_to_plm_bom, uploaded_date)VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id', [
                        historyHeadID,
                        colorways_extracted,
                        raw_material_extracted,
                        colorways_added_to_the_library,
                        raw_material_colors_added_to_the_library,
                        colorways_added_to_plm_bom,
                        raw_material_colors_added_to_plm_bom,
                        now
                    ], (e, r) => {
                        if (e) {
                            pool.query('ROLLBACK')
                            return res.status(500).json({ error: 'Unable to insert to history summary!', db: e })
                        }
                        const hsid = parseInt(r.rows[0].id)
                        //add history details
                        const insSql = 'INSERT INTO history_details (summary_id, reference_index, rm_color, rm_color_code, rm_color_supplier, rm_color_placement, rm_color_cdt, gmt_color, gmt_color_code)VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)'
                        const { details } = hrq

                        function detail_insert_and_errors_internal(detailArray) {
                            if (detailArray.length > 0) {
                                const {
                                    reference_index,
                                    rm_color,
                                    rm_color_code,
                                    rm_color_supplier,
                                    rm_color_placement,
                                    rm_color_cdt,
                                    gmt_color,
                                    gmt_color_code } = detailArray.pop()

                                const vals = [
                                    hsid,
                                    reference_index,
                                    rm_color,
                                    rm_color_code,
                                    rm_color_supplier,
                                    rm_color_placement,
                                    rm_color_cdt,
                                    gmt_color,
                                    gmt_color_code
                                ]
                                pool.query(insSql, vals, (e, _) => {
                                    if (e) {
                                        pool.query('ROLLBACK')
                                        return res.status(500).json({ error: 'Unable to insert detail data!', db: e })
                                    }
                                    detail_insert_and_errors_internal(detailArray)
                                })


                            } else {
                                //insert errors
                                const errInsSql = 'INSERT INTO history_errors (summary_id, error_type, error_description)VALUES($1, $2, $3)'
                                const { errors } = hrq
                                /**
                                 * 
                                 * @param { {error_type:string, error_description:string}[] } errorArray 
                                 */
                                function insert_error_internal(errorArray) {

                                    if (errorArray.length > 0) {

                                        const { error_type, error_description } = errorArray.pop()
                                        if ((error_type.trim().toLowerCase() === 'gmt' || error_type.trim().toLowerCase() === 'rm') && error_description) {
                                            const vals = [
                                                hsid,
                                                error_type,
                                                error_description,
                                            ]
                                            pool.query(errInsSql, vals, (e, _) => {
                                                if (e) {
                                                    pool.query('ROLLBACK')
                                                    console.error(e)
                                                    return res.status(500).json({ error: 'Unable to insert error data!', db: e })
                                                }
                                                insert_error_internal(errorArray)
                                            })
                                        } else {
                                            insert_error_internal(errorArray)
                                        }
                                    } else {
                                        pool.query('COMMIT', (e, _) => {
                                            if (e) {
                                                return res.status(500).json({ error: 'Unable to commit transction!', db: e })
                                            }
                                            return res.sendStatus(204)
                                        })

                                    }
                                }

                                if (errors) {
                                    insert_error_internal(errors)
                                } else {
                                    insert_error_internal([])
                                }
                            }
                        }

                        detail_insert_and_errors_internal(details)

                    })
                }
            })
            historyRouter.get('/customers', (_, res) => {
                pool.query('SELECT DISTINCT ON (customer_id_plm) customer_id_plm, customer_name FROM history_head', (e, r) => {

                    if (e) {
                        return res.status(500).json({ error: 'Unable to retrieve customer history information', db: e })
                    }
                    if (r.rowCount == 0) {
                        return res.status(404).json({ error: 'No customer history data available!' })
                    }

                    return res.json(
                        r.rows.map(row => ({
                            customer_id_plm: row.customer_id_plm,
                            customer_name: row.customer_name
                        }))
                    )

                })
            })
            historyRouter.get('/customer/:cust_id/seasons', (req, res) => {
                if (!req.params.cust_id) {
                    return res.status(400).json({ error: 'Customer ID is required!' })
                }
                if (req.params.cust_id.trim().toLocaleLowerCase().length == 0) {
                    return res.status(400).json({ error: 'Invalid Customer ID!' })
                }
                HistoryHelper.checkCustomer(req.params.cust_id.trim(), (bres, lerr) => {
                    if (!bres) {
                        return res.status(404).json({ error: lerr })
                    }
                    pool.query('SELECT DISTINCT ON (season_id_plm) season_id_plm, season_name FROM history_head WHERE customer_id_plm = $1', [
                        req.params.cust_id.trim()
                    ], (e, r) => {
                        if (e) {
                            return res.status(500).json({ error: 'Unable to retrieve season from customer!', db: e })
                        }
                        if (r.rowCount == 0) {
                            return res.status(404).json({ error: 'No seasons found for the selected customer!' })
                        }
                        return res.json(
                            r.rows.map(row =>
                            ({
                                season_id_plm: row.season_id_plm,
                                season_name: row.season_name
                            })

                            )
                        )
                    })
                }
                    ,
                    (e) => {
                        return res.status(500).json(e)
                    }
                )

            })
            historyRouter.get('/customer/:cust_id/season/:season_id/styles', (req, res) => {
                if (!req.params.cust_id) {
                    return res.status(400).json({ error: 'Customer ID is required!' })
                }
                if (req.params.cust_id.trim().toLocaleLowerCase().length == 0) {
                    return res.status(400).json({ error: 'Invalid Customer ID!' })
                }
                if (!req.params.season_id) {
                    return res.status(400).json({ error: 'Season ID is required!' })
                }
                if (req.params.season_id.trim().toLocaleLowerCase().length == 0) {
                    return res.status(400).json({ error: 'Invalid Season ID!' })
                }
                HistoryHelper.checkSeason(req.params.cust_id.trim(), req.params.season_id.trim(), (bres, lerr) => {
                    if (!bres) {
                        return res.status(404).json({ error: lerr })
                    }
                    pool.query('SELECT DISTINCT ON (style_id_plm) style_id_plm, style_name FROM history_head WHERE customer_id_plm = $1 AND season_id_plm = $2', [
                        req.params.cust_id.trim(),
                        req.params.season_id.trim()
                    ], (e, r) => {
                        if (e) {
                            return res.status(500).json({ error: 'Unable to retrieve styles!', db: e })
                        }
                        if (r.rowCount == 0) {
                            return res.status(404).json({ error: 'No style found for the specified season!' })
                        }
                        return res.json(
                            r.rows.map((row) => ({
                                style_id_plm: row.style_id_plm,
                                style_name: row.style_name
                            }))
                        )
                    })

                }, (e) => {
                    return res.status(500).json(e)
                })
            })
            historyRouter.get('/customer/:cust_id/season/:season_id/style/:style_id/boms', (req, res) => {
                if (!req.params.cust_id) {
                    return res.status(400).json({ error: 'Customer ID is required!' })
                }
                if (req.params.cust_id.trim().toLocaleLowerCase().length == 0) {
                    return res.status(400).json({ error: 'Invalid Customer ID!' })
                }
                if (!req.params.season_id) {
                    return res.status(400).json({ error: 'Season ID is required!' })
                }
                if (req.params.season_id.trim().toLocaleLowerCase().length == 0) {
                    return res.status(400).json({ error: 'Invalid Season ID!' })
                }
                if (!req.params.style_id) {
                    return res.status(400).json({ error: 'Style ID is required!' })
                }
                if (req.params.style_id.trim().toLocaleLowerCase().length == 0) {
                    return res.status(400).json({ error: 'Invalid Style ID!' })
                }
                HistoryHelper.checkStyle(req.params.cust_id, req.params.season_id, req.params.style_id, (bres, lerr) => {
                    if (!bres) {
                        return res.status(404).json({ error: lerr })
                    }
                    pool.query('SELECT DISTINCT ON (bom_version_id_plm) bom_version_id_plm, bom_version_name FROM history_head WHERE customer_id_plm = $1 AND season_id_plm = $2 AND style_id_plm = $3',
                        [
                            req.params.cust_id.trim(),
                            req.params.season_id.trim(),
                            req.params.style_id.trim(),
                        ],
                        (e, r) => {
                            if (e) {
                                return res.status(500).json({ error: 'Unable to retrieve BOMS', db: e })
                            }
                            if (r.rowCount == 0) {
                                return res.status(404).json({ error: 'No BOMs for specified style!' })
                            }
                            return res.json(
                                r.rows.map(
                                    (row) => ({
                                        bom_version_id_plm: row.bom_version_id_plm,
                                        bom_version_name: row.bom_version_name
                                    })
                                )
                            )
                        })
                }, (e) => {
                    return res.status(500).json(e)
                })
            })
            historyRouter.get('/customer/:cust_id/season/:season_id/style/:style_id/bom/:bom_id/upload_slots', (req, res) => {
                if (!req.params.cust_id) {
                    return res.status(400).json({ error: 'Customer ID is required!' })
                }
                if (req.params.cust_id.trim().toLocaleLowerCase().length == 0) {
                    return res.status(400).json({ error: 'Invalid Customer ID!' })
                }
                if (!req.params.season_id) {
                    return res.status(400).json({ error: 'Season ID is required!' })
                }
                if (req.params.season_id.trim().toLocaleLowerCase().length == 0) {
                    return res.status(400).json({ error: 'Invalid Season ID!' })
                }
                if (!req.params.style_id) {
                    return res.status(400).json({ error: 'Style ID is required!' })
                }
                if (req.params.style_id.trim().toLocaleLowerCase().length == 0) {
                    return res.status(400).json({ error: 'Invalid Style ID!' })
                }
                if (!req.params.bom_id) {
                    return res.status(400).json({ error: 'BOM ID is required!' })
                }
                if (req.params.bom_id.trim().toLocaleLowerCase().length == 0) {
                    return res.status(400).json({ error: 'Invalid BOM ID!' })
                }
                HistoryHelper.checkBom(req.params.cust_id, req.params.season_id, req.params.style_id, req.params.bom_id, (bres, lerr) => {
                    if (!bres) {
                        return res.status(404).json({ error: lerr })
                    }
                    pool.query('SELECT id FROM history_head WHERE customer_id_plm = $1 AND season_id_plm = $2 AND style_id_plm = $3 AND bom_version_id_plm = $4', [
                        req.params.cust_id.trim(),
                        req.params.season_id.trim(),
                        req.params.style_id.trim(),
                        req.params.bom_id.trim()
                    ], (e, r) => {
                        if (e) {
                            return res.status(500).json({ error: 'Unable to retrieve join factor for upload slot retrival!', db: e })
                        }
                        if (r.rowCount == 0) {
                            return res.status(404).json({ error: 'No joining factor found for specified info!' })
                        }
                        const id = parseInt(r.rows[0].id)
                        pool.query('SELECT id, uploaded_date FROM history_summary WHERE history_head_id = $1',
                            [
                                id
                            ], (e, r) => {
                                if (e) {
                                    return res.status(500).json({ error: 'Unable to retrieve history summary!', db: e })
                                }
                                if (r.rowCount == 0) {
                                    return res.status(404).json({ error: 'No summaries found!' })
                                }
                                return res.json(
                                    r.rows.map(
                                        (row) => ({
                                            id: row.id,
                                            uploaded_date: row.uploaded_date
                                        })
                                    )
                                )
                            })

                    })
                }, (err) => {
                    return res.status(500).json(err)
                })
            })
            historyRouter.get('/customer/:cust_id/season/:season_id/style/:style_id/bom/:bom_id/upload_slot/:slot_id/details', (req, res) => {
                if (!req.params.cust_id) {
                    return res.status(400).json({ error: 'Customer ID is required!' })
                }
                if (req.params.cust_id.trim().toLocaleLowerCase().length == 0) {
                    return res.status(400).json({ error: 'Invalid Customer ID!' })
                }
                if (!req.params.season_id) {
                    return res.status(400).json({ error: 'Season ID is required!' })
                }
                if (req.params.season_id.trim().toLocaleLowerCase().length == 0) {
                    return res.status(400).json({ error: 'Invalid Season ID!' })
                }
                if (!req.params.style_id) {
                    return res.status(400).json({ error: 'Style ID is required!' })
                }
                if (req.params.style_id.trim().toLocaleLowerCase().length == 0) {
                    return res.status(400).json({ error: 'Invalid Style ID!' })
                }
                if (!req.params.bom_id) {
                    return res.status(400).json({ error: 'BOM ID is required!' })
                }
                if (req.params.bom_id.trim().toLocaleLowerCase().length == 0) {
                    return res.status(400).json({ error: 'Invalid BOM ID!' })
                }
                if (!req.params.slot_id) {
                    return res.status(400).json({ error: 'BOM ID is required!' })
                }
                if (req.params.slot_id.trim().toLocaleLowerCase().length == 0) {
                    return res.status(400).json({ error: 'Invalid Slot ID!' })
                }
                if (isNaN(parseInt(req.params.slot_id.trim()))) {
                    return res.status(400).json({ error: 'Invalid Slot ID!' })
                }
                HistoryHelper.checkUploadSlot(req.params.cust_id, req.params.season_id, req.params.style_id, req.params.bom_id, req.params.slot_id,
                    (bres, lerr) => {
                        if (!bres) {
                            return res.status(404).json({ error: lerr })
                        }
                        //get summary! and construct the rerturn data structure
                        const ret = {}
                        pool.query('SELECT colorways_extracted, raw_material_extracted, colorways_added_to_the_library, raw_material_colors_added_to_the_library, colorways_added_to_plm_bom, raw_material_colors_added_to_plm_bom FROM history_summary INNER JOIN history_head ON history_head.id = history_summary.history_head_id WHERE history_summary.id = $1 AND  history_head.customer_id_plm = $2 AND history_head.season_id_plm = $3 AND history_head.style_id_plm = $4 AND history_head.bom_version_id_plm = $5', [
                            parseInt(req.params.slot_id.trim()),
                            req.params.cust_id.trim(),
                            req.params.season_id.trim(),
                            req.params.style_id.trim(),
                            req.params.bom_id.trim()
                        ], (e, r) => {
                            if (e) {
                                return res.status(500).json({ error: 'Unable to retrieve summary information!', db: e })
                            }

                            if (r.rowCount > 0) {
                                ret.summary = r.rows[0]
                                pool.query('SELECT reference_index, rm_color, rm_color_code, rm_color_supplier, rm_color_placement, rm_color_cdt, gmt_color, gmt_color_code FROM  history_details  WHERE summary_id = $1 ORDER BY reference_index asc', [
                                    parseInt(req.params.slot_id.trim())
                                ], (e, r) => {
                                    if (e) {
                                        return res.status(500).json({ error: 'Unable to retrieve history details!', db: e })
                                    }
                                    if (r.rowCount == 0) {
                                        ret.details = []
                                    } else {
                                        ret.details = r.rows
                                    }
                                    pool.query('SELECT error_type, error_description FROM history_errors WHERE summary_id = $1 ORDER BY error_type asc', [
                                        parseInt(req.params.slot_id.trim())
                                    ], (e, r) => {
                                        if (e) {
                                            return res.status(500).json({ error: 'Unable to retrieve error details!', db: e })
                                        }
                                        if (r.rowCount == 0) {
                                            ret.errors = []
                                        } else {
                                            ret.errors = r.rows
                                        }
                                        return res.json(ret)
                                    })
                                })
                            } else {
                                return res.status(404).json({ error: 'Details not found' })
                            }

                        })
                    }, (err) => {
                        return res.status(500).json(err)
                    })
            })



        })
    })
})



