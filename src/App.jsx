/*
 * Copyright 2025 SJTU-Geek
 * Copyright 2020-2025 SJTU-Plus
 *
 * ----------------------------------------------------------------
 * Modified by Niazye and ChiyoYuki from ECNU-minus on 2025-12-03
 * Changes:
 * - feat: update info
 *
 * Modified by 霧雨バニラ from BetterECNU on 2026-05-23
 * Changes:
 * - feat: 添加全局搜索(/search)与课程详情(/course)页面路由，独立页面隐藏侧栏全宽布局
 * - refactor: 提取 AppLayout 组件与 colorize 函数，事件处理函数使用 useCallback 优化，色彩映射使用 useMemo 缓存
 * - fix: 组织名链接后添加空格以改善排版
 *
 * Copyright 2025 ECNU-minus
 * ----------------------------------------------------------------
 */

import './App.scss'

import axios from 'axios'
import chroma from 'chroma-js'
import { groupBy } from 'lodash'
import forEach from 'lodash/forEach'
import sortedBy from 'lodash/sortBy'
import React, { useCallback, useMemo, useReducer, useState } from 'react'
import GitHubButton from 'react-github-btn'
import {
  HashRouter as Router,
  Route,
  Switch,
  useLocation,
} from 'react-router-dom'

import ClassTable from './ClassTable'
import ClassTableForm from './ClassTableForm'
import CoursePage from './CoursePage'
import FilterForm from './FilterForm'
import LessonList from './LessonList'
import LoginModal from './LoginModal'
import Navbar from './Navbar'
import PlanForm from './PlanForm'
import SearchPage from './SearchPage'
import SemesterNav from './SemesterNav'
import ShowClassTable from './ShowClassTable'
import SyncButton from './SyncButton'
import { useLocalStorageSet } from './Utils'

function colorize(starLesson) {
  const colorScale = chroma.scale('Spectral').gamma(0.5)
  const starLessonArray = [...starLesson]
  const result = {}
  forEach(
    groupBy(starLessonArray, (lesson) =>
      lesson.split('-').slice(0, 3).join('-')
    ),
    (v) => {
      const colors = colorScale.colors(v.length)
      sortedBy(v).forEach((val, idx) => (result[val] = colors[idx]))
    }
  )
  return result
}

function AppLayout({
  isMenuOpen,
  setMenuOpen,
  filterFormState,
  setFilterFormState,
  starLesson,
  setStarLesson,
  removeStarLesson,
  batchRemoveStarLessons,
  selectedLesson,
  setSelectedLesson,
  sjtuLesson,
  sjtuLessonLoading,
  syncFromISJTU,
  loginDialog,
  handleLogin,
  starColorMapping,
  sjtuColorMapping,
}) {
  const { pathname } = useLocation()
  const hideSidebar = pathname === '/search' || pathname === '/course'

  return (
    <>
      <Navbar
        onToggleClick={() => setMenuOpen(!isMenuOpen)}
        hideToggle={hideSidebar}
      />
      <LoginModal show={loginDialog} nextStep={handleLogin} />

      <div className='flex-grow-1 h-100 row' style={{ minHeight: 0 }}>
        {!hideSidebar && (
          <div
            className={`col-md-3 sidebar-container ${
              isMenuOpen ? 'open' : ''
            } h-100 d-flex flex-column`}
            style={{ minHeight: 0 }}
          >
            <div
              className='sidebar-overlay d-md-none'
              onClick={() => setMenuOpen(false)}
            ></div>
            <div className='h-100 sidebar'>
              <SemesterNav />
              <hr />
              <Switch>
                <Route path='/:semester/browse'>
                  <FilterForm
                    state={filterFormState}
                    setState={setFilterFormState}
                  />
                </Route>
                <Route path='/:semester/plan'>
                  <PlanForm
                    starLesson={starLesson}
                    removeStarLesson={removeStarLesson}
                    batchRemoveStarLessons={batchRemoveStarLessons}
                    state={selectedLesson}
                    setState={setSelectedLesson}
                    colorMapping={starColorMapping}
                  />
                </Route>
                <Route path='/:semester/classtable'>
                  <ClassTableForm
                    sjtuLesson={sjtuLesson}
                    starLesson={starLesson}
                    setStarLesson={setStarLesson}
                    dataLoading={sjtuLessonLoading}
                    syncFromISJTU={syncFromISJTU}
                    colorMapping={sjtuColorMapping}
                  />
                </Route>
                <Route>
                  <FilterForm
                    state={filterFormState}
                    setState={setFilterFormState}
                  />
                </Route>
              </Switch>

              <p className='my-3 text-muted small'>
                免责声明：本网站课程相关数据来自
                <a
                  href='https://byyt.ecnu.edu.cn/home/#/home'
                  target='_blank'
                  rel='noreferrer'
                >
                  华东师范大学教育教学管理平台
                </a>
                ，数据更新存在一定延迟性。且本网站仅供学习和交流使用，具体情况以本科生院安排为准。
              </p>
              <div className='row'>
                <div className='d-flex align-items-center col d-row'>
                  <p className='my-1 text-muted small'>
                    <a href='https://github.com/ECNU-minus/course-plus'>
                      本项目
                    </a>{' '}
                    由{' '}
                    <a
                      href='https://github.com/ECNU-minus'
                      target='_blank'
                      rel='noreferrer'
                    >
                      ECNU-Minus
                    </a>{' '}
                    维护。如您有任何需要或问题反馈，请加入{' '}
                    <a
                      href='https://qm.qq.com/q/HBbLlBtnuq'
                      target='_blank'
                      rel='noreferrer'
                    >
                      我们的用户群
                    </a>
                  </p>
                </div>
              </div>
              <div className='justify-content-end row'>
                <div className='d-flex align-items-center my-2 p-0 col-auto d-row'>
                  <GitHubButton
                    href='https://github.com/ECNU-minus/course-plus'
                    data-show-count
                    data-size='large'
                  >
                    Star
                  </GitHubButton>
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          className={`${
            hideSidebar ? 'col-12' : 'col-md-9'
          } main-content h-100 d-flex flex-column`}
          style={{ minHeight: 0 }}
        >
          <Switch>
            <Route path='/search'>
              <SearchPage />
            </Route>
            <Route path='/course'>
              <CoursePage />
            </Route>
            <Route path='/:semester/classtable'>
              <ClassTable
                selectedLesson={selectedLesson}
                colorMapping={starColorMapping}
              />
            </Route>
            <Route path='/:semester/plan'>
              <ClassTable
                selectedLesson={selectedLesson}
                colorMapping={starColorMapping}
              />
            </Route>
            <Route path='/:semester/browse'>
              <LessonList
                filterData={filterFormState}
                state={starLesson}
                setState={setStarLesson}
              />
            </Route>
            <Route>
              <LessonList
                filterData={filterFormState}
                state={starLesson}
                setState={setStarLesson}
              />
            </Route>
          </Switch>
        </div>
      </div>
    </>
  )
}

function App() {
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [filterFormState, setFilterFormState] = useReducer(
    (state, newState) => ({ ...state, ...newState }),
    {
      checkedNj: new Set(),
      checkedLx: new Set(),
      checkedYx: new Set(),
      checkedTy: new Set(),
      scheduleKey: '',
      lecturerKey: '',
      placeKey: '',
      keywordType: 'kcmc',
      keyword: '',
      composition: '',
      notes: '',
    }
  )

  const [starLesson, setStarLesson] = useLocalStorageSet(
    'starLesson',
    new Set([])
  )
  const [selectedLesson, setSelectedLesson] = useLocalStorageSet(
    'selectedLesson',
    new Set([])
  )
  const [sjtuLesson, setSjtuLesson] = useLocalStorageSet(
    'sjtuLesson',
    new Set([])
  )
  const [sjtuLessonLoading, setSjtuLessonLoading] = useState(false)

  const [loginDialog, setLoginDialog] = useState(false)

  const removeStarLesson = useCallback(
    (value) => {
      const set = new Set(starLesson)
      set.delete(value)
      setStarLesson(set)
      const set2 = new Set(selectedLesson)
      set2.delete(value)
      setSelectedLesson(set2)
    },
    [starLesson, selectedLesson, setStarLesson, setSelectedLesson]
  )

  const batchRemoveStarLessons = useCallback(
    (values) => {
      const set = new Set(starLesson)
      const set2 = new Set(selectedLesson)
      values.forEach((v) => {
        set.delete(v)
        set2.delete(v)
      })
      setStarLesson(set)
      setSelectedLesson(set2)
    },
    [starLesson, selectedLesson, setStarLesson, setSelectedLesson]
  )

  const syncFromISJTU = useCallback(
    (semester) => {
      setSjtuLessonLoading(true)
      axios
        .get(`/api/course/lesson?term=${semester.replace('_', '-')}`)
        .then((resp) => {
          if (resp?.data?.error === 'success') {
            setSjtuLesson(new Set(resp.data.entities.map((x) => x.code)))
            setSjtuLessonLoading(false)
          } else {
            setSjtuLessonLoading(false)
            setLoginDialog(true)
          }
        })
        .catch((e) => {
          setLoginDialog(true)
          setSjtuLessonLoading(false)
        })
    },
    [setSjtuLesson, setSjtuLessonLoading, setLoginDialog]
  )

  const handleLogin = useCallback((result) => {
    if (result) {
      window.location.href = '/login?app=course_plus'
    }
    setLoginDialog(false)
  }, [])

  const starColorMapping = useMemo(() => colorize(starLesson), [starLesson])
  const sjtuColorMapping = useMemo(() => colorize(sjtuLesson), [sjtuLesson])

  return (
    <Router>
      <div
        className='d-flex flex-column container-fluid vh-100'
        style={{ minHeight: 0 }}
      >
        <AppLayout
          isMenuOpen={isMenuOpen}
          setMenuOpen={setMenuOpen}
          filterFormState={filterFormState}
          setFilterFormState={setFilterFormState}
          starLesson={starLesson}
          setStarLesson={setStarLesson}
          removeStarLesson={removeStarLesson}
          batchRemoveStarLessons={batchRemoveStarLessons}
          selectedLesson={selectedLesson}
          setSelectedLesson={setSelectedLesson}
          sjtuLesson={sjtuLesson}
          sjtuLessonLoading={sjtuLessonLoading}
          syncFromISJTU={syncFromISJTU}
          loginDialog={loginDialog}
          handleLogin={handleLogin}
          starColorMapping={starColorMapping}
          sjtuColorMapping={sjtuColorMapping}
        />
      </div>
    </Router>
  )
}

export default App
