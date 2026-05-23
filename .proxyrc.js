/*
 * Copyright 2025 SJTU-Geek
 * Copyright 2020-2025 SJTU-Plus
 *
 * ----------------------------------------------------------------
 * Modified by 霧雨バニラ from BetterECNU on 2026-05-23
 * Changes:
 * - refactor: 移除未使用的 createProxyMiddleware 导入
 *
 * Copyright 2025 ECNU-minus
 * ----------------------------------------------------------------
 */

const serveStatic = require('serve-static')

module.exports = function (app) {
    app.use('/course-plus-data', serveStatic('public/course-plus-data'))

    let loggedIn = false

    app.use('/login', (req, res) => {
        loggedIn = true
        res.redirect('/')
    })

    app.use('/api/course/lesson', (req, res) => {
        if (loggedIn) {
            setTimeout(() => res.json({
                error: "success",
                entities: ["(2020-2021-2)-EI314-1", "(2020-2021-2)-IS305-1"].map(x => ({ code: x }))
            }), 500)
        } else {
            res.json({ 'error': 'not logged in' })
        }
    })
};