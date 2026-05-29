/*
 * Copyright 2026 BetterECNU
 */

import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import uniqBy from 'lodash/uniqBy'
import React, { useEffect, useRef, useState } from 'react'
import Badge from 'react-bootstrap/Badge'
import Form from 'react-bootstrap/Form'
import Spinner from 'react-bootstrap/Spinner'
import { useHistory } from 'react-router-dom'

import { useAllLessons, useLessonConversion } from './Utils'

function semesterLabel(year, term) {
  let season = term
  if (term === 'Autumn' || term === 'Fall') season = '秋'
  else if (term === 'Spring') season = '春'
  else if (term === 'Summer') season = '夏'
  else if (term === 'Winter') season = '冬'
  return `${year} ${season}`
}

export default function SearchPage() {
  const [keyword, setKeyword] = useState(() => {
    try {
      return window.localStorage.getItem('searchKeyword') || ''
    } catch {
      return ''
    }
  })

  const [searchedKeyword, setSearchedKeyword] = useState('')

  const handleKeywordChange = (e) => {
    const value = e.target.value
    setKeyword(value)
    try {
      window.localStorage.setItem('searchKeyword', value)
    } catch {}
  }
  const [searched, setSearched] = useState(false)
  const { data: allLessons, loading, error, fetchAll } = useAllLessons()
  const { data: lessonConversion } = useLessonConversion()
  const history = useHistory()
  const debounceRef = useRef(null)

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    if (!keyword.trim()) {
      setSearched(false)
      setSearchedKeyword('')
      return
    }
    debounceRef.current = setTimeout(() => {
      setSearchedKeyword(keyword)
      setSearched(true)
      fetchAll()
    }, 300)
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [keyword, fetchAll])

  const filteredLessons = (() => {
    if (!allLessons || !searchedKeyword.trim()) return null
    const kw = searchedKeyword.trim().toLowerCase()
    return allLessons.filter((lesson) => {
      if (lesson.kcmc.toLowerCase().includes(kw)) return true
      if (lesson.kch.toLowerCase().includes(kw)) return true
      if (lessonConversion) {
        if (lessonConversion.to_new[lesson.kch]) {
          if (lessonConversion.to_new[lesson.kch].toLowerCase().includes(kw)) {
            return true
          }
        }
        if (lessonConversion.to_old[lesson.kch]) {
          if (lessonConversion.to_old[lesson.kch].toLowerCase().includes(kw)) {
            return true
          }
        }
      }
      return false
    })
  })()

  const groupedCourses = (() => {
    if (!filteredLessons) return null
    const grouped = groupBy(filteredLessons, 'kch')
    return sortBy(
      Object.entries(grouped).map(([kch, lessons]) => {
        const semesters = sortBy(
          uniqBy(
            lessons.map((l) => ({ year: l._year, term: l._term })),
            (s) => s.year + s.term
          ),
          ['year', 'term']
        )
        return {
          kch,
          kcmc: lessons[0].kcmc,
          semesters,
        }
      }),
      'kch'
    )
  })()

  return (
    <div
      className='d-flex flex-column p-3 h-100 search-page'
      style={{ width: '100%', maxWidth: 'none', minWidth: 0, margin: 0 }}
    >
      <div
        className='search-page-header'
        style={{ width: '100%', minWidth: 0 }}
      >
        <h5 className='mb-3'>全局搜索</h5>
        <p className='mb-3 text-muted small'>
          搜索所有学期数据，查找课程的开课记录
        </p>

        <Form.Group className='mb-3'>
          <Form.Control
            placeholder='输入课程名称或课程代码……'
            name='keyword'
            value={keyword}
            onChange={handleKeywordChange}
          />
        </Form.Group>

        {error && (
          <div className='alert alert-danger small'>
            加载数据失败：{error.message}
          </div>
        )}

        {loading && (
          <div className='d-flex align-items-center my-4'>
            <Spinner
              animation='border'
              size='sm'
              role='status'
              className='mr-2 text-primary'
            />
            <span className='text-muted small'>正在加载所有学期数据……</span>
          </div>
        )}
      </div>

      <div
        className='search-page-list'
        style={{ width: '100%', minWidth: 0, flex: '1 1 0' }}
      >
        {!loading && searched && groupedCourses && (
          <>
            <p className='mb-3 text-muted small'>
              共找到 {groupedCourses.length} 门课程
            </p>
            <div
              className='search-results'
              style={{ width: '100%', minWidth: 0 }}
            >
              {groupedCourses.map((course) => (
                <div
                  key={course.kch}
                  className='w-100 search-result-item card'
                  style={{ cursor: 'pointer' }}
                  onClick={() => history.push(`/course?id=${course.kch}`)}
                >
                  <div className='px-3 py-2 card-body'>
                    <div className='d-flex align-items-start justify-content-between search-result-row'>
                      <div className='search-result-main'>
                        <span className='font-weight-bold text-primary search-result-code'>
                          {course.kch}
                        </span>
                        <span className='ml-2 search-result-name'>
                          {course.kcmc}
                        </span>
                      </div>
                      <span className='ml-2 text-muted text-nowrap small'>
                        {course.semesters.length} 个学期
                      </span>
                    </div>
                    <div className='mt-1'>
                      {course.semesters.map((sem) => (
                        <Badge
                          key={sem.year + sem.term}
                          variant='light'
                          className='mr-1 mb-1 semester-badge'
                        >
                          {semesterLabel(sem.year, sem.term)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && searched && groupedCourses && groupedCourses.length === 0 && (
          <div className='my-5 text-muted text-center'>
            <p>未找到匹配的课程</p>
            <p className='small'>请尝试其他关键词</p>
          </div>
        )}

        {!searched && (
          <div className='my-5 text-muted text-center'>
            <p className='mb-2'>输入课程名称或代码开始搜索</p>
            <p className='small'>支持按课程名称或课程代码搜索所有学期数据</p>
          </div>
        )}
      </div>
    </div>
  )
}
