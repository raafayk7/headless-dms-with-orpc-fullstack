#!/usr/bin/env bun

import "reflect-metadata"
import { faker } from "@faker-js/faker"
import { eq } from "drizzle-orm"
import { createDbInstance } from "@/infra/db/conn"
import { users, documents, account } from "@/infra/db/schema"
import { StorageService } from "@/infra/storage/storage.service"
import { UUID } from "@domain/utils/refined-types"
import type { UserType } from "@domain/user/user.entity"
import type { DocumentType } from "@domain/document/document.entity"

const db = createDbInstance()
const storageService = new StorageService()

// Seed configuration - use environment variables for security
const SEED_CONFIG = {
  users: {
    count: 5,
    adminCount: 1,
  },
  documents: {
    count: 10,
    fileTypes: ['txt', 'pdf', 'jpg', 'png'] as const,
  },
  defaultPassword: process.env.SEED_PASSWORD || "password123",
}

type FileType = typeof SEED_CONFIG.documents.fileTypes[number]

// Generate realistic user data
function generateUsers(): Array<{
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  password: string
}> {
  const generatedUsers = []
  
  // Generate admin user
  const adminName = faker.person.fullName()
  generatedUsers.push({
    id: UUID.new(),
    name: adminName,
    email: `admin@dms.local`,
    role: 'admin' as const,
    password: SEED_CONFIG.defaultPassword,
  })
  
  // Generate regular users
  for (let i = 0; i < SEED_CONFIG.users.count - SEED_CONFIG.users.adminCount; i++) {
    const name = faker.person.fullName()
    generatedUsers.push({
      id: UUID.new(),
      name,
      email: `user${i + 1}@dms.local`,
      role: 'user' as const,
      password: SEED_CONFIG.defaultPassword,
    })
  }
  
  return generatedUsers
}

// Generate file content based on type
function generateFileContent(fileType: FileType, fileName: string): Buffer {
  switch (fileType) {
    case 'txt':
      const textContent = faker.lorem.paragraphs(faker.number.int({ min: 2, max: 5 }))
      return Buffer.from(textContent, 'utf8')
    
    case 'pdf':
      // Simple PDF-like content (basic text format)
      const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(${fileName.replace('.pdf', '')}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF`
      return Buffer.from(pdfContent, 'utf8')
    
    case 'jpg':
    case 'png':
      // Simple image data (minimal valid image format)
      const imageHeader = fileType === 'jpg' 
        ? Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]) // JPEG header
        : Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) // PNG header
      
      // Add some dummy image data
      const imageData = Buffer.alloc(1000, 0x00)
      return Buffer.concat([imageHeader, imageData])
    
    default:
      return Buffer.from(`Placeholder content for ${fileType} file`, 'utf8')
  }
}

// Get MIME type for file type
function getMimeType(fileType: FileType): string {
  const mimeTypes: Record<FileType, string> = {
    'txt': 'text/plain',
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'png': 'image/png',
  }
  return mimeTypes[fileType]
}

// Generate document data
async function generateDocuments(userIds: string[]): Promise<Array<{
  id: string
  name: string
  filePath: string
  mimeType: string
  size: number
  tags: string[]
  metadata: Record<string, string>
}>> {
  const generatedDocuments = []
  
  for (let i = 0; i < SEED_CONFIG.documents.count; i++) {
    const fileType = faker.helpers.arrayElement(SEED_CONFIG.documents.fileTypes)
    const userId = faker.helpers.arrayElement(userIds)
    
    // Generate realistic document name
    const prefixes = [
      'Q4_Report', 'Annual_Review', 'Project_Proposal', 'Meeting_Notes', 'Budget_Plan',
      'Vacation_Photo', 'Family_Picture', 'Work_Document', 'Personal_Note', 'Reference_Guide'
    ]
    const prefix = faker.helpers.arrayElement(prefixes)
    const date = faker.date.recent().toISOString().split('T')[0]
    const randomSuffix = faker.string.alphanumeric(4)
    const fileName = `${prefix}_${date}_${randomSuffix}.${fileType}`
    
    // Generate file content
    const fileContent = generateFileContent(fileType, fileName)
    
    // Upload to storage
    const uploadResult = await storageService.upload(
      fileContent,
      fileName,
      getMimeType(fileType)
    )
    
    if (uploadResult.isErr()) {
      console.error(`❌ Failed to upload file ${fileName}:`, uploadResult.unwrapErr())
      continue
    }
    
    const filePath = uploadResult.unwrap()
    
    // Generate tags
    const allTags = ['work', 'personal', 'important', 'draft', 'archived', 'active', 'confidential', 'review']
    const tagCount = faker.number.int({ min: 1, max: 3 })
    const selectedTags = faker.helpers.arrayElements(allTags, tagCount)
    
    // Generate metadata
    const metadata: Record<string, string> = {
      author: faker.person.fullName(),
      department: faker.commerce.department(),
      project: faker.company.catchPhrase(),
      version: faker.string.alphanumeric(3),
      status: faker.helpers.arrayElement(['draft', 'review', 'approved', 'final']),
      priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
      createdAt: faker.date.recent().toISOString(),
    }
    
    generatedDocuments.push({
      id: UUID.new(),
      name: fileName,
      filePath,
      mimeType: getMimeType(fileType),
      size: fileContent.length,
      tags: selectedTags,
      metadata,
    })
  }
  
  return generatedDocuments
}

async function seedDatabase() {
  console.log("🌱 Starting DMS database seed...")
  console.log("=" .repeat(50))

  try {
    // Generate users
    console.log("👥 Generating users...")
    const generatedUsers = generateUsers()
    console.log(`✅ Generated ${generatedUsers.length} users (${generatedUsers.filter(u => u.role === 'admin').length} admin)`)

    // Check for existing users and create new ones
    const userIds: string[] = []
    
    for (const userData of generatedUsers) {
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1)

      let userId: UserType["id"]

      if (existingUser.length > 0 && existingUser[0]) {
        console.log(`👤 User ${userData.email} already exists, using existing user`)
        userId = existingUser[0].id as UserType["id"]
      } else {
        // Hash password
        const hashedPassword = await Bun.password.hash(userData.password, {
          algorithm: "argon2id",
        })

        // Create the user
        console.log(`👤 Creating user: ${userData.email} (${userData.role})`)
        const newUsers = await db
          .insert(users)
          .values({
            id: userData.id as UserType["id"],
            name: userData.name,
            email: userData.email,
            role: userData.role,
            emailVerified: true,
          })
          .returning({ id: users.id })

        if (newUsers.length === 0 || !newUsers[0]) {
          throw new Error(`Failed to create user: ${userData.email}`)
        }
        userId = newUsers[0].id as UserType["id"]

        // Create account record with hashed password for email/password auth
        await db.insert(account).values({
          accountId: userData.email,
          providerId: "credential",
          userId: userId as UserType["id"],
          password: hashedPassword,
        })

        console.log(`✅ Created user and credentials for: ${userData.email}`)
      }
      
      userIds.push(userId)
    }

    // Generate documents
    console.log("📄 Generating documents...")
    const generatedDocuments = await generateDocuments(userIds)
    console.log(`✅ Generated ${generatedDocuments.length} documents`)

    // Save documents to database
    console.log("💾 Saving documents to database...")
    for (const doc of generatedDocuments) {
      await db.insert(documents).values({
        id: doc.id as DocumentType["id"],
        name: doc.name,
        filePath: doc.filePath,
        mimeType: doc.mimeType,
        size: doc.size,
        tags: doc.tags,
        metadata: doc.metadata,
      })
    }
    console.log("✅ Documents saved to database")

    console.log("🎉 DMS database seeding completed successfully!")
    console.log("\n📋 Seed Summary:")
    console.log(`   👥 Users: ${generatedUsers.length} (${generatedUsers.filter(u => u.role === 'admin').length} admin)`)
    console.log(`   📄 Documents: ${generatedDocuments.length}`)
    console.log(`   📁 File Types: ${SEED_CONFIG.documents.fileTypes.join(', ')}`)
    console.log("\n🔑 Generated User Credentials:")
    console.log("=====================================")
    generatedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.role.toUpperCase()}: ${user.email}`)
      console.log(`   Password: ${user.password}`)
      console.log(`   ID: ${user.id}`)
      console.log('')
    })
    console.log("=====================================")
    console.log("💡 Use these credentials to login to your DMS!")
    console.log("=" .repeat(50))

  } catch (error) {
    console.error("❌ Error seeding database:", error)
    process.exit(1)
  }
}

// Run the seed function
if (import.meta.main) {
  await seedDatabase()
  process.exit(0)
}

export { seedDatabase }
