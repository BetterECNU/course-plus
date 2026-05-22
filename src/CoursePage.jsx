/*
 * Copyright 2026 BetterECNU
 */

import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import React, { useEffect, useMemo } from 'react'
import Badge from 'react-bootstrap/Badge'
import Spinner from 'react-bootstrap/Spinner'
import { useHistory, useLocation } from 'react-router-dom'

import {
  parseTimeLocation,
  useAllLessons,
  useLessonConversion,
} from './Utils'

function semesterLabel(year, term) {
  let season = term
  if (term === 'Autumn' || term === 'Fall') season = '秋'
  else if (term === 'Spring') season = '春'
  else if (term === 'Summer') season = '夏'
  else if (term === 'Winter') season = '冬'
  return `${year} ${season}`
}

export default function CoursePage() {
  const location = useLocation()
  const history = useHistory()
  const params = new URLSearchParams(location.search)
  const courseId = params.get('id')

  const { data: allLessons, loading, error, fetchAll } = useAllLessons()
  const { data: lessonConversion } = useLessonConversion()

  useEffect(() => {
    if (courseId) {
      fetchAll()
    }
  }, [courseId, fetchAll])

  const courseLessons = useMemo(() => {
    if (!allLessons || !courseId) return null

    // Collect all possible course codes including conversions
    const codes = new Set([courseId])
    if (lessonConversion) {
      if (lessonConversion.to_old[courseId]) {
        codes.add(lessonConversion.to_old[courseId])
      }
      // Also check reverse: if an old code maps to courseId
      for (const [oldCode, newCode] of Object.entries(
        lessonConversion.to_new || {}
      )) {
        if (newCode === courseId) {
          codes.add(oldCode)
        }
      }
    }

    return allLessons.filter((l) => codes.has(l.kch))
  }, [allLessons, courseId, lessonConversion])

  const groupedByYear = useMemo(() => {
    if (!courseLessons || courseLessons.length === 0) return null
    const sorted = sortBy(courseLessons, ['_year', '_term'])
    const grouped = groupBy(sorted, '_year')
    // Sort years descending (newest first)
    return sortBy(Object.entries(grouped), ([year]) => year).reverse()
  }, [courseLessons])

  if (!courseId) {
    return (
      <div className='my-5 text-muted text-center'>
        <p>未指定课程代码</p>
        <p className='small'>
          <a href='#/search' className='text-primary'>
            前往全局搜索
          </a>
        </p>
      </div>
    )
  }

  const courseName =
    courseLessons && courseLessons.length > 0
      ? courseLessons[0].kcmc
      : courseId

  return (
    <div className='p-3 course-page'>
      {/* Header */}
      <div className='d-flex align-items-center mb-3'>
        <button
          className='mr-2 btn-outline-secondary btn btn-sm'
          onClick={() => history.goBack()}
        >
          ← 返回
        </button>
        <a href='#/search' className='text-muted btn btn-sm btn-link'>
          全局搜索
        </a>
      </div>

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

      {error && (
        <div className='alert alert-danger small'>
          加载数据失败：{error.message}
        </div>
      )}

      {!loading && courseLessons && courseLessons.length > 0 && (
        <>
          <div className='mb-4 course-header'>
            <h4>
              <span className='text-primary'>{courseLessons[0].kch}</span>
              <span className='ml-2'>{courseName}</span>
            </h4>
            <p className='mb-0 text-muted small'>
              共 {courseLessons.length} 条开课记录，覆盖{' '}
              {groupedByYear.length} 个学年
            </p>
          </div>

          {groupedByYear.map(([year, lessons]) => (
            <div key={year} className='course-year-group mb-4'>
              <h5 className='mb-3 course-year-title'>
                <Badge variant='primary' className='mr-2'>
                  {year}
                </Badge>
                学年
              </h5>

              <div className='course-lessons'>
                {sortBy(lessons, ['_term', 'jxbmc']).map((lesson, idx) => (
                  <div
                    key={lesson._source + '-' + lesson._semester + '-' + (lesson.jxbmc || idx)}
                    className='mb-2 card course-lesson-card'
                  >
                    <div className='px-3 py-2 card-body'>
                      {/* Top row: semester + code */}
                      <div className='d-flex align-items-start justify-content-between mb-2'>
                        <div>
                          <Badge
                            variant={
                              lesson._term === 'Spring' ||
                                lesson._term === 'Summer'
                                ? 'success'
                                : 'warning'
                            }
                            className='mr-2'
                          >
                            {semesterLabel('', lesson._term)}
                          </Badge>
                          <span className='text-muted small'>
                            {lesson.jxbmc}
                          </span>
                        </div>
                        <span className='text-muted small'>
                          {lesson.xf} 学分 / {lesson.rwzxs} 学时
                        </span>
                      </div>

                      {/* Teacher info */}
                      <div className='mb-2'>
                        <span className='mr-1 text-muted small'>教师：</span>
                        <span className='small'>{lesson.jszc}</span>
                        {lesson.zjs && lesson.zjs !== lesson.jszc && (
                          <span className='ml-1 text-muted small'>
                            (上课：{lesson.zjs})
                          </span>
                        )}
                      </div>

                      {/* Time & Location */}
                      <div className='mb-2'>
                        <span className='mr-1 text-muted small'>
                          时间地点：
                        </span>
                        <ul className='mb-0 list-unstyled small'>
                          {parseTimeLocation(lesson.sksj, lesson.jxdd).map(
                            (tl, i) => (
                              <li key={i} className='mb-0'>
                                {tl.time} {tl.location}
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      {/* Bottom row: department + type + notes */}
                      <div className='d-flex flex-wrap align-items-center text-muted small'>
                        <span className='mr-2'>{lesson.kkxy}</span>
                        {lesson.kcxzmc && (
                          <span className='mr-2'>{lesson.kcxzmc}</span>
                        )}
                        {lesson.skyy && (
                          <span className='mr-2'>{lesson.skyy}</span>
                        )}
                        {lesson.xkbz && (
                          <span className='mr-2'>备注：{lesson.xkbz}</span>
                        )}
                      </div>

                      {/* Class composition */}
                      {lesson.jxbzc && (
                        <div className='mt-1'>
                          <span className='text-muted small'>班级组成：</span>
                          <span className='small'>{lesson.jxbzc}</span>
                        </div>
                      )}

                      {/* Link to browse this semester */}
                      <div className='mt-2'>
                        <a
                          href={`#/${lesson._semester}/browse`}
                          className='small'
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                        >
                          在此学期中查看 →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {!loading &&
        !error &&
        courseLessons &&
        courseLessons.length === 0 && (
          <div className='my-5 text-muted text-center'>
            <p>未找到课程 {courseId} 的开课记录</p>
            <p className='small'>
              该课程代码可能不存在或已更新，请尝试使用新课程代码搜索
            </p>
          </div>
        )}
    </div>
  )
}
