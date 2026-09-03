'use server'

import { db } from '@/lib/db'
import { libraryBooks, subject } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

const SEED_BOOKS = [
  {
    id: 'res-1',
    title: 'Essential Mathematics for Senior Secondary Schools (Book 1)',
    category: 'Textbooks',
    subject: 'Mathematics',
    classLevel: 'SSS 1',
    author: 'Dr. O. A. Adebayo',
    pages: 412,
    downloads: 128,
    fileSize: '14.2 MB',
    content: `Chapter 1: Number Bases. Let's learn conversion between bases, addition, and subtraction in other bases. Binary, octal, and hexadecimal operations...`
  },
  {
    id: 'res-2',
    title: 'Modern Biology for Senior Secondary Schools',
    category: 'Textbooks',
    subject: 'Biology',
    classLevel: 'SSS 2',
    author: 'Prof. T. U. Ndu',
    pages: 385,
    downloads: 95,
    fileSize: '18.5 MB',
    content: `Chapter 3: Photosynthesis. Photosynthesis is the chemical process by which green plants build up complex organic substances from carbon dioxide and water using light energy...`
  },
  {
    id: 'res-3',
    title: 'New School Physics for SSS',
    category: 'Textbooks',
    subject: 'Physics',
    classLevel: 'SSS 3',
    author: 'M. W. Anyakoha',
    pages: 520,
    downloads: 242,
    fileSize: '22.1 MB',
    content: `Chapter 12: Waves and Wave Motion. Reflection, refraction, diffraction, and polarization of wave pulses. Formulas for frequency, wavelength, and velocity...`
  },
  {
    id: 'res-4',
    title: 'Interactive English Grammar & Composition',
    category: 'Textbooks',
    subject: 'English Language',
    classLevel: 'JSS 2',
    author: 'Sarah I. Williams',
    pages: 210,
    downloads: 74,
    fileSize: '8.4 MB',
    content: `Unit 4: Pronouns and Conjunctions. Learn subjective, objective, possessive, and relative pronouns with classroom examples...`
  },
  {
    id: 'res-5',
    title: 'WAEC Mathematics Past Questions & Solutions (2020 - 2025)',
    category: 'Past Questions',
    subject: 'Mathematics',
    classLevel: 'SSS 3',
    author: 'EGIA Academic Committee',
    pages: 88,
    downloads: 512,
    fileSize: '4.8 MB',
    content: `WAEC 2024 Theory Section A. Question 1: Simplify 3(x-2)/4 - (2x-1)/3 = 5. Solution details inside...`
  },
  {
    id: 'res-6',
    title: 'NECO Civic Education Past Exam Papers',
    category: 'Past Questions',
    subject: 'Civic Education',
    classLevel: 'SSS 3',
    author: 'EGIA Academic Committee',
    pages: 45,
    downloads: 189,
    fileSize: '3.1 MB',
    content: `Section A: National Values, Citizenship, human rights, and constitutional structures in Nigeria...`
  },
  {
    id: 'res-7',
    title: 'Junior WAEC (BECE) Basic Science Solved Papers',
    category: 'Past Questions',
    subject: 'Biology',
    classLevel: 'JSS 3',
    author: 'EGIA Prep Board',
    pages: 64,
    downloads: 305,
    fileSize: '5.2 MB',
    content: `BECE 2023. Basic science components including simple machines, light transmission, and skeletal systems...`
  },
  {
    id: 'res-8',
    title: 'Grade 5 Arithmetic Operations & Word Problems Notes',
    category: 'Class Notes',
    subject: 'Mathematics',
    classLevel: 'Primary 5',
    author: 'Mrs. Blessing Obi',
    pages: 18,
    downloads: 42,
    fileSize: '1.2 MB',
    content: `Week 2 Notes: Long Division and Prime Factorization. Always find the smallest prime factor first, then divide continuously...`
  },
  {
    id: 'res-9',
    title: 'SSS 2 Chemistry: Complete Organic Chemistry Revision Notes',
    category: 'Class Notes',
    subject: 'Chemistry',
    classLevel: 'SSS 2',
    author: 'Mr. Emmanuel Okafor',
    pages: 35,
    downloads: 167,
    fileSize: '2.8 MB',
    content: `Introduction to Alkanes, Alkenes, Alkynes. Saturated vs. unsaturated hydrocarbons, IUPAC nomenclature rules, and laboratory preparation methods...`
  },
  {
    id: 'res-10',
    title: 'Video Lecture: Quadratic Equations Made Super Easy',
    category: 'Video Tutorials',
    subject: 'Mathematics',
    classLevel: 'SSS 1',
    author: 'Mr. Charles Udoh',
    pages: 1,
    downloads: 98,
    fileSize: '45.0 MB',
    content: `[Simulated Video Playback] This 15-minute video lecture explains factoring, completing the square, and using the quadratic formula: x = (-b ± √(b² - 4ac)) / 2a.`
  },
  {
    id: 'res-11',
    title: 'Computer Science: Introduction to Python Programming',
    category: 'Video Tutorials',
    subject: 'Computer Studies',
    classLevel: 'SSS 2',
    author: 'Dr. Jane Peters',
    pages: 1,
    downloads: 140,
    fileSize: '65.2 MB',
    content: `[Simulated Video Playback] Master variables, loop structures, conditionals, and standard input/output syntax in Python.`
  },
  {
    id: 'res-12',
    title: 'Primary 4 Elementary Science Discovery Guide',
    category: 'Study Guides',
    subject: 'Biology',
    classLevel: 'Primary 4',
    author: 'Mrs. Sandra Alabi',
    pages: 28,
    downloads: 36,
    fileSize: '3.4 MB',
    content: `Discovery Guide. Unit 1: Living and Non-Living things. Interactive field assignments: observing backyard insects and naming plant leaves...`
  }
]

/** The library uses the same active Supabase subject catalogue as registration. */
export async function getLibrarySubjects() {
  return db.select({ id: subject.id, name: subject.name })
    .from(subject)
    .where(eq(subject.isActive, true))
    .orderBy(asc(subject.name))
}

export async function searchLibraryBooks(query: string = '') {
  try {
    // Try to retrieve existing library books from local database
    let results = await db.select().from(libraryBooks)

    // Seed database dynamically if it is completely empty
    if (results.length === 0) {
      for (const item of SEED_BOOKS) {
        await db.insert(libraryBooks).values({
          id: item.id,
          title: item.title,
          category: item.category,
          subject: item.subject,
          classLevel: item.classLevel,
          author: item.author,
          content: item.content,
          location: 'Main Block digital repository',
          isbn: `ISBN-${Math.floor(1000000 + Math.random() * 9000000)}`
        }).onConflictDoNothing()
      }
      results = await db.select().from(libraryBooks)
    }

    const trimmedQuery = query.trim().toLowerCase()
    if (!trimmedQuery) {
      return results.map(book => ({
        id: book.id,
        title: book.title,
        category: book.category || 'Textbooks',
        subject: book.subject || 'Mathematics',
        classLevel: book.classLevel || 'SSS 1',
        author: book.author || 'EL LEARNERS App AUTHOR',
        pages: book.category === 'Video Tutorials' ? 1 : 210,
        downloads: 85,
        fileSize: '12.4 MB',
        content: book.content || ''
      }))
    }

    // Google-like keyword and phrase exact search algorithm matching in memory
    const searchTerms = trimmedQuery.split(/\s+/).filter(Boolean)

    const filtered = results.filter(book => {
      const fullText = `
        ${book.title || ''}
        ${book.author || ''}
        ${book.category || ''}
        ${book.subject || ''}
        ${book.classLevel || ''}
        ${book.content || ''}
      `.toLowerCase()

      // Full phrase matches first, or all individual keywords must match (Google behavior)
      if (fullText.includes(trimmedQuery)) {
        return true
      }
      return searchTerms.every(term => fullText.includes(term))
    })

    return filtered.map(book => ({
      id: book.id,
      title: book.title,
      category: book.category || 'Textbooks',
      subject: book.subject || 'Mathematics',
      classLevel: book.classLevel || 'SSS 1',
      author: book.author || 'EL LEARNERS App AUTHOR',
      pages: book.category === 'Video Tutorials' ? 1 : 210,
      downloads: 85,
      fileSize: '12.4 MB',
      content: book.content || ''
    }))
  } catch (error) {
    console.warn('Database library search fallback to resilient client catalog:', error)
    const trimmedQuery = query.trim().toLowerCase()
    if (!trimmedQuery) return SEED_BOOKS
    const searchTerms = trimmedQuery.split(/\s+/).filter(Boolean)
    return SEED_BOOKS.filter(item => {
      const text = `${item.title} ${item.author} ${item.content} ${item.subject} ${item.category}`.toLowerCase()
      if (text.includes(trimmedQuery)) return true
      return searchTerms.every(term => text.includes(term))
    })
  }
}
