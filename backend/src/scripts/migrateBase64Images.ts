import mongoose from 'mongoose';
import { Project } from '../models/Project.model';
import { convertBase64ToCloudinary, isBase64Image } from '../utils/imageProcessor';
import { config } from '../config/env';
import { v2 as cloudinary } from 'cloudinary';

interface MigrationStats {
  totalProjects: number;
  projectsWithBase64: number;
  totalBase64Images: number;
  successfulConversions: number;
  failedConversions: number;
  errors: string[];
}

/**
 * Migration script to convert base64 images to Cloudinary URLs
 */
async function migrateBase64Images(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalProjects: 0,
    projectsWithBase64: 0,
    totalBase64Images: 0,
    successfulConversions: 0,
    failedConversions: 0,
    errors: []
  };

  try {
    console.log('🚀 Starting base64 image migration...');
    
    // Check Cloudinary configuration
    console.log('🔧 Checking Cloudinary configuration...');
    if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
      throw new Error('Cloudinary credentials not found. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
    }
    console.log(`✅ Cloudinary configured for: ${config.cloudinary.cloudName}`);
    
    // Initialize Cloudinary with credentials
    cloudinary.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.apiSecret,
    });
    console.log('✅ Cloudinary initialized successfully');
    
    // Connect to database
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to database');

    // Get all projects
    const projects = await Project.find({});
    stats.totalProjects = projects.length;
    console.log(`📊 Found ${stats.totalProjects} projects`);

    for (const project of projects) {
      let projectUpdated = false;
      const updatedSections = [...project.sections];

      // Check sections for base64 images
      for (let i = 0; i < updatedSections.length; i++) {
        const section = updatedSections[i];
        
        if (section.type === 'image' && isBase64Image(section.content)) {
          stats.totalBase64Images++;
          console.log(`🔄 Converting base64 image in project: ${project.name}`);
          
          try {
            const result = await convertBase64ToCloudinary(
              section.content,
              `${config.cloudinary.folderName}/${project.name.replace(/[^a-zA-Z0-9]/g, '_')}`
            );
            
            updatedSections[i] = {
              ...section,
              content: result.url
            };
            
            stats.successfulConversions++;
            projectUpdated = true;
            console.log(`✅ Converted image ${i + 1} in project: ${project.name}`);
            
          } catch (error) {
            stats.failedConversions++;
            const errorMsg = `Failed to convert image in project ${project.name}: ${error}`;
            stats.errors.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
            
            // Remove the base64 content to prevent future issues
            updatedSections[i] = {
              ...section,
              content: ''
            };
            projectUpdated = true;
          }
        }
      }

      // Update project if any changes were made
      if (projectUpdated) {
        stats.projectsWithBase64++;
        await Project.findByIdAndUpdate(project._id, {
          sections: updatedSections
        });
        console.log(`💾 Updated project: ${project.name}`);
      }
    }

    console.log('\n📈 Migration completed!');
    console.log(`Total projects: ${stats.totalProjects}`);
    console.log(`Projects with base64 images: ${stats.projectsWithBase64}`);
    console.log(`Total base64 images found: ${stats.totalBase64Images}`);
    console.log(`Successful conversions: ${stats.successfulConversions}`);
    console.log(`Failed conversions: ${stats.failedConversions}`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      stats.errors.forEach(error => console.log(`  - ${error}`));
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    stats.errors.push(`Migration failed: ${error}`);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }

  return stats;
}

// Run migration if called directly
if (require.main === module) {
  migrateBase64Images()
    .then(stats => {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { migrateBase64Images };
