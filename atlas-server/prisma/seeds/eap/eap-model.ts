import { PrismaClient } from '@prisma/client';
import {
  TypeDefinitionDataSchema,
  AttributeDefinitionArraySchema,
  RelationDefinitionDataSchema
} from 'atlas-shared/zod';
import { DEFAULT_TENANT_ID } from '../default-tenant';


let prisma: PrismaClient;
let tenantId: string;

export async function seedModel(client: PrismaClient, tid: string = DEFAULT_TENANT_ID) {
  prisma = client;
  tenantId = tid;
  console.log('🌱 Starting database seed...\n');

  // Clear existing data (using raw TRUNCATE CASCADE to bypass FK constraint & trigger issues)
  console.log('🗑️  Clearing existing data...');
  // Truncate entities and relations first, this cascades to many other things.
  // We use TRUNCATE with CASCADE to avoid the foreign key constraint from audit_events
  // which gets inserted by DB triggers for deleted rows.
  await client.$executeRawUnsafe(`
    TRUNCATE TABLE 
      audit_events, 
      relations, 
      entities, 
      entity_definitions, 
      relation_definitions, 
      type_definitions 
    CASCADE;
  `);

  console.log('✓ Data cleared\n');

  // Seed Type Definitions (reusable enum types)
  console.log('📋 Seeding type definitions...');
  const typeDefinitions = await seedTypeDefinitions();
  console.log(`   Created ${typeDefinitions.length} type definitions\n`);

  // Seed Entity Definitions (field metadata)
  console.log('📐 Seeding entity definitions...');
  const entityDefinitions = await seedEntityDefinitions();
  console.log(`   Created ${entityDefinitions.length} entity definitions\n`);

  // Seed Relation Definitions
  console.log('🔗 Seeding relation definitions...');
  const relationDefinitions = await seedRelationDefinitions();
  console.log(`   Created ${relationDefinitions.length} relation definitions\n`);

  // Seed Users
  console.log('👤 Seeding users...');
  const users = await seedUsers();
  console.log(`   Created ${users.length} users\n`);

  // Seed Technologies
  console.log('🔧 Seeding technologies...');
  const technologies = await seedTechnologies();
  console.log(`   Created ${technologies.length} technologies\n`);

  // Seed IT Assets
  console.log('🖥️  Seeding IT assets...');
  const assets = await seedITAssets();
  console.log(`   Created ${assets.length} IT assets\n`);

  // Seed Business Capabilities
  console.log('📊 Seeding business capabilities...');
  const capabilities = await seedBusinessCapabilities();
  console.log(`   Created ${capabilities.length} business capabilities\n`);

  // Seed Data Objects
  console.log('📦 Seeding data objects...');
  const dataObjects = await seedDataObjects();
  console.log(`   Created ${dataObjects.length} data objects\n`);

  // Seed Interfaces
  console.log('🔌 Seeding interfaces...');
  const interfaces = await seedInterfaces();
  console.log(`   Created ${interfaces.length} interfaces\n`);

  // Seed Processes
  console.log('⚙️  Seeding processes...');
  const processes = await seedProcesses();
  console.log(`   Created ${processes.length} processes\n`);

  // Seed Applications
  console.log('📱 Seeding applications...');
  const applications = await seedApplications();
  console.log(`   Created ${applications.length} applications\n`);

  // Seed Relations (Instance Data)
  const relationCount = await seedRelations(
    users,
    technologies,
    assets,
    capabilities,
    dataObjects,
    interfaces,
    processes,
    applications
  );
  console.log(`   Created ${relationCount} relations\n`);

  // Summary
  const totalEntities = await prisma.entity.count();
  console.log('✅ Seed completed!');
  console.log(`   Total entities: ${totalEntities}\n`);
}

// =============================================================================
// Seed Functions
// =============================================================================

// -----------------------------------------------------------------------------
// Type Definitions (reusable enum types)
// -----------------------------------------------------------------------------

async function seedTypeDefinitions() {
  const types = [
    // Application-related enums
    {
      typeKey: 'application_status',
      displayName: 'Application Status',
      baseType: 'enum',
      options: [
        { key: 'active', displayName: 'Active', description: 'Application is live and in production use' },
        { key: 'deprecated', displayName: 'Deprecated', description: 'Scheduled for retirement, avoid new usage' },
        { key: 'in-development', displayName: 'In Development', description: 'Currently being built or enhanced' },
        { key: 'retired', displayName: 'Retired', description: 'No longer in use or supported' },
      ],
    },
    {
      typeKey: 'criticality',
      displayName: 'Criticality',
      baseType: 'enum',
      options: [
        { key: 'low', displayName: 'Low', description: 'Minimal business impact if unavailable' },
        { key: 'medium', displayName: 'Medium', description: 'Moderate business impact' },
        { key: 'high', displayName: 'High', description: 'Significant business impact' },
        { key: 'critical', displayName: 'Critical', description: 'Severe business impact, mission-critical' },
      ],
    },
    {
      typeKey: 'cia_rating',
      displayName: 'CIA Rating',
      baseType: 'enum',
      options: [
        { key: 'low', displayName: 'Low' },
        { key: 'medium', displayName: 'Medium' },
        { key: 'high', displayName: 'High' },
        { key: 'critical', displayName: 'Critical' },
      ],
    },
    {
      typeKey: 'impact_severity',
      displayName: 'Impact Severity',
      baseType: 'enum',
      options: [
        { key: 'none', displayName: 'None', description: 'No impact on business operations' },
        { key: 'minor', displayName: 'Minor', description: 'Slight inconvenience, easy workaround exists' },
        { key: 'moderate', displayName: 'Moderate', description: 'Noticeable impact requiring attention' },
        { key: 'major', displayName: 'Major', description: 'Significant disruption to operations' },
        { key: 'catastrophic', displayName: 'Catastrophic', description: 'Complete failure, severe financial/legal impact' },
      ],
    },
    {
      typeKey: 'testing_frequency',
      displayName: 'Testing Frequency',
      baseType: 'enum',
      options: [
        { key: 'monthly', displayName: 'Monthly' },
        { key: 'quarterly', displayName: 'Quarterly' },
        { key: 'semi-annually', displayName: 'Semi-Annually' },
        { key: 'annually', displayName: 'Annually' },
        { key: 'not-tested', displayName: 'Not Tested' },
      ],
    },
    {
      typeKey: 'time_classification',
      displayName: 'TIME Classification',
      baseType: 'enum',
      options: [
        { key: 'tolerate', displayName: 'Tolerate', description: 'Accept as-is, minimal investment' },
        { key: 'invest', displayName: 'Invest', description: 'Strategic value, invest in enhancement' },
        { key: 'migrate', displayName: 'Migrate', description: 'Replace with modern alternative' },
        { key: 'eliminate', displayName: 'Eliminate', description: 'Decommission, no longer needed' },
      ],
    },
    {
      typeKey: 'ownership_role',
      displayName: 'Ownership Role',
      baseType: 'enum',
      options: [
        { key: 'functional-owner', displayName: 'Functional Owner', description: 'Business owner responsible for requirements' },
        { key: 'technical-owner', displayName: 'Technical Owner', description: 'IT owner responsible for technical decisions' },
        { key: 'functional-delegate', displayName: 'Functional Delegate', description: 'Delegated business responsibility' },
        { key: 'technical-delegate', displayName: 'Technical Delegate', description: 'Delegated technical responsibility' },
      ],
    },
    // IT Asset enums
    {
      typeKey: 'dependency_type',
      displayName: 'Dependency Type',
      baseType: 'enum',
      options: [
        { key: 'runs-on', displayName: 'Runs On', description: 'Application runs on this infrastructure' },
        { key: 'depends-on', displayName: 'Depends On', description: 'Runtime dependency' },
        { key: 'hosting', displayName: 'Hosting', description: 'Provides hosting services' },
        { key: 'network', displayName: 'Network', description: 'Network connectivity dependency' },
      ],
    },
    {
      typeKey: 'asset_type',
      displayName: 'Asset Type',
      baseType: 'enum',
      options: [
        { key: 'server', displayName: 'Server' },
        { key: 'database', displayName: 'Database' },
        { key: 'storage', displayName: 'Storage' },
        { key: 'network', displayName: 'Network' },
        { key: 'cloud-service', displayName: 'Cloud Service' },
        { key: 'web-server', displayName: 'Web Server' },
        { key: 'middleware', displayName: 'Middleware' },
        { key: 'runtime', displayName: 'Runtime' },
      ],
    },
    {
      typeKey: 'asset_status',
      displayName: 'Asset Status',
      baseType: 'enum',
      options: [
        { key: 'online', displayName: 'Online', description: 'Operational and available' },
        { key: 'offline', displayName: 'Offline', description: 'Not available' },
        { key: 'maintenance', displayName: 'Maintenance', description: 'Undergoing planned maintenance' },
      ],
    },
    {
      typeKey: 'hosting_type',
      displayName: 'Hosting Type',
      baseType: 'enum',
      options: [
        { key: 'on-premise', displayName: 'On-Premise', description: 'Hosted in own data center' },
        { key: 'public-cloud', displayName: 'Public Cloud', description: 'Hosted on public cloud (AWS, Azure, GCP)' },
        { key: 'private-cloud', displayName: 'Private Cloud', description: 'Hosted on private cloud infrastructure' },
        { key: 'hybrid', displayName: 'Hybrid', description: 'Mix of on-premise and cloud' },
        { key: 'co-location', displayName: 'Co-location', description: 'Third-party data center' },
      ],
    },
    {
      typeKey: 'asset_environment',
      displayName: 'Environment',
      baseType: 'enum',
      options: [
        { key: 'production', displayName: 'Production', description: 'Live production environment' },
        { key: 'staging', displayName: 'Staging', description: 'Pre-production testing' },
        { key: 'development', displayName: 'Development', description: 'Development environment' },
        { key: 'disaster-recovery', displayName: 'Disaster Recovery', description: 'DR failover environment' },
        { key: 'test', displayName: 'Test', description: 'Testing environment' },
      ],
    },
    // Technology enums
    {
      typeKey: 'technology_type',
      displayName: 'Technology Type',
      baseType: 'enum',
      options: [
        { key: 'language', displayName: 'Language' },
        { key: 'framework', displayName: 'Framework' },
        { key: 'library', displayName: 'Library' },
        { key: 'tool', displayName: 'Tool' },
        { key: 'platform', displayName: 'Platform' },
        { key: 'database', displayName: 'Database' },
        { key: 'runtime', displayName: 'Runtime' },
      ],
    },
    {
      typeKey: 'technology_recommendation',
      displayName: 'Recommendation',
      baseType: 'enum',
      options: [
        { key: 'adopt', displayName: 'Adopt', description: 'Ready for production use, standard choice' },
        { key: 'trial', displayName: 'Trial', description: 'Worth pursuing in limited pilot' },
        { key: 'assess', displayName: 'Assess', description: 'Worth exploring with research goals' },
        { key: 'hold', displayName: 'Hold', description: 'Do not use for new projects' },
      ],
    },
    // Interface enums
    {
      typeKey: 'interface_type',
      displayName: 'Interface Type',
      baseType: 'enum',
      options: [
        { key: 'api', displayName: 'API', description: 'REST, GraphQL, or other API' },
        { key: 'file-transfer', displayName: 'File Transfer', description: 'SFTP, FTP, or file-based' },
        { key: 'database', displayName: 'Database', description: 'Direct database connection' },
        { key: 'message-queue', displayName: 'Message Queue', description: 'Kafka, RabbitMQ, etc.' },
        { key: 'webhook', displayName: 'Webhook', description: 'Event-driven HTTP callbacks' },
      ],
    },
    {
      typeKey: 'interface_direction',
      displayName: 'Direction',
      baseType: 'enum',
      options: [
        { key: 'sends', displayName: 'Sends', description: 'Data flows outward' },
        { key: 'receives', displayName: 'Receives', description: 'Data flows inward' },
        { key: 'bidirectional', displayName: 'Bidirectional', description: 'Data flows both ways' },
      ],
    },
    {
      typeKey: 'sla_level',
      displayName: 'SLA Level',
      baseType: 'enum',
      options: [
        { key: 'gold', displayName: 'Gold', description: 'Highest priority, fastest response' },
        { key: 'silver', displayName: 'Silver', description: 'Standard priority' },
        { key: 'bronze', displayName: 'Bronze', description: 'Best effort' },
      ],
    },
    // Data Object enums
    {
      typeKey: 'data_object_category',
      displayName: 'Category',
      baseType: 'enum',
      options: [
        { key: 'master-data', displayName: 'Master Data', description: 'Core business entities' },
        { key: 'transactional', displayName: 'Transactional', description: 'Business events and transactions' },
        { key: 'reference', displayName: 'Reference', description: 'Lookup data and codes' },
        { key: 'analytical', displayName: 'Analytical', description: 'Derived data for analytics' },
        { key: 'operational', displayName: 'Operational', description: 'System/process data' },
      ],
    },
    {
      typeKey: 'data_object_classification',
      displayName: 'Classification',
      baseType: 'enum',
      options: [
        { key: 'public', displayName: 'Public', description: 'No restrictions on access' },
        { key: 'internal', displayName: 'Internal', description: 'Internal use only' },
        { key: 'confidential', displayName: 'Confidential', description: 'Restricted access, need-to-know' },
        { key: 'restricted', displayName: 'Restricted', description: 'Highly sensitive, strict controls' },
      ],
    },
    // Process enums
    {
      typeKey: 'process_type',
      displayName: 'Process Type',
      baseType: 'enum',
      options: [
        { key: 'value-chain', displayName: 'Value Chain', description: 'Core business value delivery' },
        { key: 'business-process', displayName: 'Business Process', description: 'Standard business operation' },
        { key: 'management', displayName: 'Management', description: 'Governance and oversight' },
        { key: 'support', displayName: 'Support', description: 'Supporting function' },
        { key: 'automated-workflow', displayName: 'Automated Workflow', description: 'System-driven automation' },
        { key: 'case-management', displayName: 'Case Management', description: 'Case-based processing' },
      ],
    },
    {
      typeKey: 'entity_status',
      displayName: 'Status',
      baseType: 'enum',
      options: [
        { key: 'active', displayName: 'Active', description: 'Currently in use' },
        { key: 'planned', displayName: 'Planned', description: 'Scheduled for future implementation' },
        { key: 'deprecated', displayName: 'Deprecated', description: 'Being phased out' },
      ],
    },
  ];

  return Promise.all(
    types.map((t) => {
      // Validate type definition against schema
      TypeDefinitionDataSchema.parse(t);

      return prisma.typeDefinition.upsert({
        where: { type_definitions_key_tenant_unique: { typeKey: t.typeKey, tenantId } },
        update: {
          displayName: t.displayName,
          baseType: t.baseType as any,
          options: t.options,
        },
        create: {
          typeKey: t.typeKey,
          displayName: t.displayName,
          baseType: t.baseType as any,
          options: t.options,
          tenantId,
        },
      });
    }),
  );
}

// -----------------------------------------------------------------------------
// Entity Definitions (field metadata)
// -----------------------------------------------------------------------------

async function seedEntityDefinitions() {
  const definitions = [
    // Application Schema
    {
      entityType: 'application',
      displayName: 'Application',
      attributeSchema: [
        // Core fields (stored in entity columns)
        { key: 'name', displayName: 'Name', type: 'string', required: true, group: 'basic' },
        { key: 'description', displayName: 'Description', type: 'text', group: 'basic' },
        // Basic attributes
        { key: 'status', displayName: 'Status', typeRef: 'application_status', group: 'basic' },
        { key: 'criticality', displayName: 'Criticality', typeRef: 'criticality', group: 'basic' },
        { key: 'department', displayName: 'Department', type: 'string', group: 'ownership' },
        { key: 'version', displayName: 'Version', type: 'string', group: 'basic' },
        { key: 'documentation', displayName: 'Documentation URL', type: 'string', group: 'basic' },
        // Strategic Assessment (TIME Model)
        { key: 'functionalFit', displayName: 'Functional Fit', type: 'number', validation: { min: 1, max: 5 }, group: 'strategic' },
        { key: 'technicalFit', displayName: 'Technical Fit', type: 'number', validation: { min: 1, max: 5 }, group: 'strategic' },
        { key: 'timeClassification', displayName: 'TIME Classification', typeRef: 'time_classification', group: 'strategic' },
        // CIA+A Ratings
        { key: 'confidentiality', displayName: 'Confidentiality', typeRef: 'cia_rating', group: 'cia' },
        { key: 'integrity', displayName: 'Integrity', typeRef: 'cia_rating', group: 'cia' },
        { key: 'availability', displayName: 'Availability', typeRef: 'cia_rating', group: 'cia' },
        { key: 'authenticity', displayName: 'Authenticity', typeRef: 'cia_rating', group: 'cia' },
        // BIA - Recovery Objectives
        { key: 'rtoRequired', displayName: 'RTO Required (hours)', type: 'number', validation: { min: 0, max: 8760 }, group: 'bia' },
        { key: 'rpoRequired', displayName: 'RPO Required (hours)', type: 'number', validation: { min: 0, max: 8760 }, group: 'bia' },
        { key: 'mtpdRequired', displayName: 'MTPD Required (hours)', type: 'number', validation: { min: 0, max: 8760 }, group: 'bia' },
        { key: 'rtoCapability', displayName: 'RTO Capability (hours)', type: 'number', validation: { min: 0, max: 8760 }, group: 'bia' },
        { key: 'rpoCapability', displayName: 'RPO Capability (hours)', type: 'number', validation: { min: 0, max: 8760 }, group: 'bia' },
        { key: 'mtpdCapability', displayName: 'MTPD Capability (hours)', type: 'number', validation: { min: 0, max: 8760 }, group: 'bia' },
        { key: 'businessImpact', displayName: 'Business Impact', typeRef: 'impact_severity', group: 'bia' },
        { key: 'financialImpactPerHour', displayName: 'Financial Impact ($/hour)', type: 'decimal', group: 'bia' },
        // DORA Compliance
        { key: 'testingFrequency', displayName: 'Testing Frequency', typeRef: 'testing_frequency', group: 'dora' },
        { key: 'lastTestedDate', displayName: 'Last Tested Date', type: 'date', group: 'dora' },
        { key: 'recoveryProcedureDoc', displayName: 'Recovery Procedure Doc', type: 'string', group: 'dora' },
        { key: 'alternativeProcedure', displayName: 'Alternative Procedure', type: 'text', group: 'dora' },
        { key: 'thirdPartyProvider', displayName: 'Third-Party Provider', type: 'string', group: 'dora' },
        { key: 'isOutsourced', displayName: 'Is Outsourced', type: 'boolean', group: 'dora' },
        { key: 'exitStrategy', displayName: 'Exit Strategy', type: 'text', group: 'dora' },
        // CRA Compliance
        { key: 'securityContact', displayName: 'Security Contact', type: 'string', group: 'cra' },
        { key: 'vulnerabilityDisclosure', displayName: 'Vulnerability Disclosure URL', type: 'string', group: 'cra' },
        { key: 'sbomAvailable', displayName: 'SBOM Available', type: 'boolean', group: 'cra' },
        { key: 'lastSecurityAssessment', displayName: 'Last Security Assessment', type: 'date', group: 'cra' },
        { key: 'patchingFrequency', displayName: 'Patching Frequency', type: 'string', group: 'cra' },
        // Regulatory
        { key: 'regulatoryScope', displayName: 'Regulatory Scope', type: 'string', isArray: true, group: 'regulatory' },
        { key: 'complianceNotes', displayName: 'Compliance Notes', type: 'text', group: 'regulatory' },
        { key: 'dataResidency', displayName: 'Data Residency', type: 'string', group: 'regulatory' },
        // Relations - these are stored in the relations table, not in attributes
        { key: 'ownerships', displayName: 'Owners', type: 'relation', relType: 'app_owned_by', group: 'ownership' },
        { key: 'usesAssets', displayName: 'IT Assets', type: 'relation', relType: 'app_uses_asset', group: 'infrastructure' },
        { key: 'usesTechnologies', displayName: 'Technologies', type: 'relation', relType: 'app_uses_technology', group: 'techstack' },
        { key: 'managesData', displayName: 'Data Objects', type: 'relation', relType: 'app_manages_data', group: 'data' },
        { key: 'supportsCapabilities', displayName: 'Business Capabilities', type: 'relation', relType: 'app_supports_capability', group: 'business' },
        // Incoming relations - where this app is the TARGET of the relation (auto-detected from RelationDefinition)
        { key: 'ownedInterfaces', displayName: 'Owned Interfaces', type: 'relation', relType: 'interface_owned_by', group: 'integration' },
      ],
    },
    // IT Asset Schema
    {
      entityType: 'it_asset',
      displayName: 'IT Asset',
      attributeSchema: [
        { key: 'name', displayName: 'Name', type: 'string', required: true, group: 'basic' },
        { key: 'description', displayName: 'Description', type: 'text', group: 'basic' },
        { key: 'type', displayName: 'Type', typeRef: 'asset_type', required: true, group: 'basic' },
        { key: 'status', displayName: 'Status', typeRef: 'asset_status', required: true, group: 'basic' },
        { key: 'hostingType', displayName: 'Hosting Type', typeRef: 'hosting_type', group: 'basic' },
        { key: 'environment', displayName: 'Environment', typeRef: 'asset_environment', group: 'basic' },
        { key: 'location', displayName: 'Location', type: 'string', group: 'basic' },
        { key: 'dependsOn', displayName: 'Depends On', type: 'relation', relType: 'asset_depends_on_asset', side: 'from', group: 'dependencies' },
        { key: 'usedByApplications', displayName: 'Used By Applications', type: 'relation', relType: 'app_uses_asset', group: 'usage' },
      ],
    },
    // Technology Schema
    {
      entityType: 'technology',
      displayName: 'Technology',
      attributeSchema: [
        { key: 'name', displayName: 'Name', type: 'string', required: true, group: 'basic' },
        { key: 'description', displayName: 'Description', type: 'text', group: 'basic' },
        { key: 'type', displayName: 'Type', typeRef: 'technology_type', required: true, group: 'basic' },
        { key: 'recommendation', displayName: 'Recommendation', typeRef: 'technology_recommendation', group: 'basic' },
        { key: 'version', displayName: 'Version', type: 'string', group: 'basic' },
        { key: 'vendor', displayName: 'Vendor', type: 'string', group: 'basic' },
        { key: 'website', displayName: 'Website', type: 'string', group: 'basic' },
        { key: 'license', displayName: 'License', type: 'string', group: 'basic' },
        { key: 'tags', displayName: 'Tags', type: 'string', isArray: true, group: 'basic' },
      ],
    },
    // Interface Schema
    {
      entityType: 'interface',
      displayName: 'Interface',
      attributeSchema: [
        { key: 'name', displayName: 'Name', type: 'string', required: true, group: 'basic' },
        { key: 'description', displayName: 'Description', type: 'text', group: 'basic' },
        { key: 'type', displayName: 'Type', typeRef: 'interface_type', group: 'basic' },
        { key: 'protocol', displayName: 'Protocol', type: 'string', group: 'basic' },
        { key: 'frequency', displayName: 'Frequency', type: 'string', group: 'basic' },
        { key: 'slaLevel', displayName: 'SLA Level', typeRef: 'sla_level', group: 'basic' },
        { key: 'status', displayName: 'Status', typeRef: 'entity_status', group: 'basic' },
        // Relations - stored in relations table
        { key: 'ownerApp', displayName: 'Owner Application', type: 'relation', relType: 'interface_owned_by', group: 'ownership' },
        { key: 'connections', displayName: 'Connected Applications', type: 'relation', relType: 'interface_connects', group: 'connections' },
        { key: 'transfersData', displayName: 'Data Objects', type: 'relation', relType: 'interface_transfers_data', group: 'data' },
      ],
    },
    // Data Object Schema
    {
      entityType: 'data_object',
      displayName: 'Data Object',
      attributeSchema: [
        { key: 'name', displayName: 'Name', type: 'string', required: true, group: 'basic' },
        { key: 'description', displayName: 'Description', type: 'text', group: 'basic' },
        { key: 'category', displayName: 'Category', typeRef: 'data_object_category', group: 'basic' },
        { key: 'classification', displayName: 'Classification', typeRef: 'data_object_classification', group: 'basic', isPersonalData: true },
        { key: 'owner', displayName: 'Owner', type: 'string', group: 'basic' },
        { key: 'retentionPeriodDays', displayName: 'Retention Period (Days)', type: 'number', validation: { min: 0 }, group: 'basic' },
        { key: 'relatesTo', displayName: 'Relates To', type: 'string', isArray: true, group: 'detail' },
        { key: 'attributes', displayName: 'Attributes', type: 'string', isArray: true, group: 'detail' },
        { key: 'isPersonalData', displayName: 'Is Personal Data', type: 'boolean', group: 'regulatory' },
        { key: 'regulatoryScope', displayName: 'Regulatory Scope', type: 'string', isArray: true, group: 'regulatory' },
        { key: 'dataResidency', displayName: 'Data Residency', type: 'string', group: 'regulatory' },
        // CIA Ratings
        { key: 'confidentiality', displayName: 'Confidentiality', typeRef: 'cia_rating', group: 'cia' },
        { key: 'integrity', displayName: 'Integrity', typeRef: 'cia_rating', group: 'cia' },
        { key: 'availability', displayName: 'Availability', typeRef: 'cia_rating', group: 'cia' },
        { key: 'authenticity', displayName: 'Authenticity', typeRef: 'cia_rating', group: 'cia' },
      ],
    },
    // Business Capability Schema
    {
      entityType: 'business_capability',
      displayName: 'Business Capability',
      attributeSchema: [
        { key: 'name', displayName: 'Name', type: 'string', required: true, group: 'basic' },
        { key: 'description', displayName: 'Description', type: 'text', group: 'basic' },
        { key: 'level', displayName: 'Level', type: 'number', validation: { min: 1, max: 5 }, group: 'basic' },
        { key: 'status', displayName: 'Status', typeRef: 'entity_status', group: 'basic' },
        { key: 'domain', displayName: 'Domain', type: 'string', group: 'basic' },
      ],
    },
    // Process Schema
    {
      entityType: 'process',
      displayName: 'Process',
      attributeSchema: [
        { key: 'name', displayName: 'Name', type: 'string', required: true, group: 'basic' },
        { key: 'description', displayName: 'Description', type: 'text', group: 'basic' },
        { key: 'type', displayName: 'Type', typeRef: 'process_type', group: 'basic' },
        { key: 'owner', displayName: 'Owner', type: 'string', group: 'basic' },
        { key: 'status', displayName: 'Status', typeRef: 'entity_status', group: 'basic' },
        { key: 'automationLevel', displayName: 'Automation Level', type: 'string', group: 'basic' },
        { key: 'criticality', displayName: 'Criticality', typeRef: 'criticality', group: 'basic' },
        // BIA
        { key: 'rto', displayName: 'RTO (hours)', type: 'number', validation: { min: 0 }, group: 'bia' },
        { key: 'rpo', displayName: 'RPO (hours)', type: 'number', validation: { min: 0 }, group: 'bia' },
        { key: 'mtpd', displayName: 'MTPD (hours)', type: 'number', validation: { min: 0 }, group: 'bia' },
        { key: 'businessImpact', displayName: 'Business Impact', typeRef: 'impact_severity', group: 'bia' },
        { key: 'financialImpactPerHour', displayName: 'Financial Impact ($/hour)', type: 'decimal', group: 'bia' },
        // Regulatory & DORA
        { key: 'regulatoryScope', displayName: 'Regulatory Scope', type: 'string', isArray: true, group: 'regulatory' },
        { key: 'complianceNotes', displayName: 'Compliance Notes', type: 'text', group: 'regulatory' },
        { key: 'recoveryProcedureDoc', displayName: 'Recovery Procedure', type: 'string', group: 'dora' },
        { key: 'alternativeProcedure', displayName: 'Alternative Procedure', type: 'text', group: 'dora' },
        { key: 'testingFrequency', displayName: 'Testing Frequency', typeRef: 'testing_frequency', group: 'dora' },
      ],
    },
    // User Schema
    {
      entityType: 'user',
      displayName: 'User',
      attributeSchema: [
        { key: 'name', displayName: 'Full Name', type: 'string', required: true, group: 'basic' },
        { key: 'description', displayName: 'Description', type: 'text', group: 'basic' },
        { key: 'firstName', displayName: 'First Name', type: 'string', group: 'basic', isPersonalData: true },
        { key: 'lastName', displayName: 'Last Name', type: 'string', group: 'basic', isPersonalData: true },
        { key: 'email', displayName: 'Email', type: 'string', group: 'basic', isPersonalData: true },
        { key: 'role', displayName: 'Role', type: 'string', group: 'basic' },
        { key: 'avatarUrl', displayName: 'Avatar URL', type: 'string', group: 'basic' },
        { key: 'lastLogin', displayName: 'Last Login', type: 'datetime', group: 'system' },
      ],
    },
  ];

  return Promise.all(
    definitions.map((d) => {
      // Validate entity definition fields using schema
      AttributeDefinitionArraySchema.parse(d.attributeSchema);

      return prisma.entityDefinition.upsert({
        where: { entity_definitions_type_tenant_unique: { entityType: d.entityType, tenantId } },
        update: {
          displayName: d.displayName,
          attributeSchema: d.attributeSchema,
        },
        create: {
          entityType: d.entityType,
          displayName: d.displayName,
          attributeSchema: d.attributeSchema,
          tenantId,
        },
      });
    }),
  );
}

// -----------------------------------------------------------------------------
// Relation Definitions
// -----------------------------------------------------------------------------

async function seedRelationDefinitions() {
  const definitions = [
    {
      relationType: 'app_uses_technology',
      displayName: 'Uses Technology',
      fromEntityType: 'application',
      toEntityType: 'technology',
      isDirectional: true,
    },
    {
      relationType: 'app_uses_asset',
      displayName: 'Uses Asset',
      fromEntityType: 'application',
      toEntityType: 'it_asset',
      isDirectional: true,
    },
    {
      relationType: 'app_manages_data',
      displayName: 'Manages Data',
      fromEntityType: 'application',
      toEntityType: 'data_object',
      isDirectional: true,
    },
    {
      relationType: 'app_supports_capability',
      displayName: 'Supports Capability',
      fromEntityType: 'application',
      toEntityType: 'business_capability',
      isDirectional: true,
    },

    {
      relationType: 'app_owned_by',
      displayName: 'Owned By',
      fromEntityType: 'application',
      toEntityType: 'user',
      isDirectional: true,
      // Attribute schema for this relation - defines what fields describe the relationship
      attributeSchema: [
        {
          key: 'ownershipRole',
          displayName: 'Ownership Role',
          typeRef: 'ownership_role',
          required: true,
        },
      ],
    },
    {
      relationType: 'asset_depends_on_asset',
      displayName: 'Depends On',
      fromEntityType: 'it_asset',
      toEntityType: 'it_asset',
      isDirectional: true,
      attributeSchema: [
        {
          key: 'dependencyType',
          displayName: 'Dependency Type',
          typeRef: 'dependency_type',
          required: true,
        },
      ],
    },
    // Interface relations
    {
      relationType: 'interface_owned_by',
      displayName: 'Owned By',
      fromEntityType: 'interface',
      toEntityType: 'application',
      isDirectional: true,
    },
    {
      relationType: 'interface_connects',
      displayName: 'Connects To',
      fromEntityType: 'interface',
      toEntityType: 'application',
      isDirectional: true,
      attributeSchema: [
        {
          key: 'direction',
          displayName: 'Direction',
          typeRef: 'interface_direction',
          required: true,
        },
      ],
    },
    {
      relationType: 'interface_transfers_data',
      displayName: 'Transfers Data',
      fromEntityType: 'interface',
      toEntityType: 'data_object',
      isDirectional: true,
    },
    {
      relationType: 'process_uses_app',
      displayName: 'Uses Application',
      fromEntityType: 'process',
      toEntityType: 'application',
      isDirectional: true,
    },
    {
      relationType: 'capability_parent_of',
      displayName: 'Parent Of',
      fromEntityType: 'business_capability',
      toEntityType: 'business_capability',
      isDirectional: true,
    },
  ];

  return Promise.all(
    definitions.map((d) => {
      // Validate relation definition using schema
      RelationDefinitionDataSchema.parse(d);

      return prisma.relationDefinition.upsert({
        where: { relation_definitions_type_tenant_unique: { relationType: d.relationType, tenantId } },
        update: {
          displayName: d.displayName,
          fromEntityType: d.fromEntityType,
          toEntityType: d.toEntityType,
          isDirectional: d.isDirectional,
          attributeSchema: d.attributeSchema as any,
        },
        create: {
          relationType: d.relationType,
          displayName: d.displayName,
          fromEntityType: d.fromEntityType,
          toEntityType: d.toEntityType,
          isDirectional: d.isDirectional,
          attributeSchema: d.attributeSchema as any,
          tenantId,
        },
      });
    }),
  );
}

// -----------------------------------------------------------------------------
// Entity Data
// -----------------------------------------------------------------------------

async function seedUsers() {
  const users = [
    {
      name: 'John Smith',
      description: 'Functional Owner - Sales',
      attributes: {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@company.com',
        role: 'Functional Owner',
        avatarUrl: 'https://i.pravatar.cc/150?u=john',
        lastLogin: new Date().toISOString(),
      },
    },
    {
      name: 'Sarah Johnson',
      description: 'Functional Owner - HR',
      attributes: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@company.com',
        role: 'Functional Owner',
        avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
        lastLogin: new Date().toISOString(),
      },
    },
    {
      name: 'Michael Chen',
      description: 'Technical Owner - CRM',
      attributes: {
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@company.com',
        role: 'Technical Owner',
        avatarUrl: 'https://i.pravatar.cc/150?u=michael',
        lastLogin: new Date().toISOString(),
      },
    },
    {
      name: 'David Brown',
      description: 'Developer',
      attributes: {
        firstName: 'David',
        lastName: 'Brown',
        email: 'david.brown@company.com',
        role: 'Developer',
        avatarUrl: 'https://i.pravatar.cc/150?u=david',
        lastLogin: new Date().toISOString(),
      },
    },
    {
      name: 'Emily Davis',
      description: 'Product Owner',
      attributes: {
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily.davis@company.com',
        role: 'Product Owner',
        avatarUrl: 'https://i.pravatar.cc/150?u=emily',
        lastLogin: new Date().toISOString(),
      },
    },
    {
      name: 'Alex Turner',
      description: 'Solution Architect',
      attributes: {
        firstName: 'Alex',
        lastName: 'Turner',
        email: 'alex.turner@company.com',
        role: 'Architect',
        avatarUrl: 'https://i.pravatar.cc/150?u=alex',
        lastLogin: new Date().toISOString(),
      },
    },
    {
      name: 'Lisa Anderson',
      description: 'QA Lead',
      attributes: {
        firstName: 'Lisa',
        lastName: 'Anderson',
        email: 'lisa.anderson@company.com',
        role: 'QA Lead',
        avatarUrl: 'https://i.pravatar.cc/150?u=lisa',
        lastLogin: new Date().toISOString(),
      },
    },
    {
      name: 'Robert Wilson',
      description: 'Database Administrator',
      attributes: {
        firstName: 'Robert',
        lastName: 'Wilson',
        email: 'robert.wilson@company.com',
        role: 'DBA',
        avatarUrl: 'https://i.pravatar.cc/150?u=robert',
        lastLogin: new Date().toISOString(),
      },
    },
  ];

  return Promise.all(
    users.map((user) =>
      prisma.entity.create({
        data: {
          entityType: 'user',
          name: user.name,
          description: user.description,
          attributes: user.attributes,
          updatedBy: 'seed',
          tenantId,
        },
      }),
    ),
  );
}

async function seedTechnologies() {
  const technologies = [
    {
      name: 'React',
      description: 'A JavaScript library for building user interfaces',
      attributes: {
        type: 'framework',
        recommendation: 'adopt',
        version: '18.x',
        vendor: 'Meta',
        website: 'https://react.dev',
        license: 'MIT',
        tags: ['frontend', 'ui', 'spa'],
      },
    },
    {
      name: 'Node.js',
      description: 'JavaScript runtime built on Chrome V8 engine',
      attributes: {
        type: 'runtime',
        recommendation: 'adopt',
        version: '20.x LTS',
        vendor: 'OpenJS Foundation',
        website: 'https://nodejs.org',
        license: 'MIT',
        tags: ['backend', 'javascript', 'server'],
      },
    },
    {
      name: 'PostgreSQL',
      description: 'Powerful, open source object-relational database system',
      attributes: {
        type: 'database',
        recommendation: 'adopt',
        version: '16.x',
        vendor: 'PostgreSQL Global Development Group',
        website: 'https://www.postgresql.org',
        license: 'PostgreSQL License',
        tags: ['sql', 'relational', 'acid'],
      },
    },
    {
      name: 'Java',
      description: 'High-level, class-based, object-oriented programming language',
      attributes: {
        type: 'language',
        recommendation: 'adopt',
        version: '21 LTS',
        vendor: 'Oracle',
        website: 'https://www.java.com',
        license: 'GPL-2.0',
        tags: ['backend', 'enterprise', 'jvm'],
      },
    },
    {
      name: 'Spring Boot',
      description: 'Java-based framework for microservices',
      attributes: {
        type: 'framework',
        recommendation: 'adopt',
        version: '3.x',
        vendor: 'VMware',
        website: 'https://spring.io/projects/spring-boot',
        license: 'Apache-2.0',
        tags: ['backend', 'java', 'microservices'],
      },
    },
    {
      name: 'Oracle Database',
      description: 'Enterprise relational database management system',
      attributes: {
        type: 'database',
        recommendation: 'hold',
        version: '19c',
        vendor: 'Oracle',
        website: 'https://www.oracle.com/database/',
        license: 'Commercial',
        tags: ['sql', 'enterprise', 'legacy'],
      },
    },
    {
      name: 'TypeScript',
      description: 'Typed superset of JavaScript',
      attributes: {
        type: 'language',
        recommendation: 'adopt',
        version: '5.x',
        vendor: 'Microsoft',
        website: 'https://www.typescriptlang.org',
        license: 'Apache-2.0',
        tags: ['frontend', 'backend', 'typed'],
      },
    },
    {
      name: 'Docker',
      description: 'Container platform for application deployment',
      attributes: {
        type: 'platform',
        recommendation: 'adopt',
        version: '24.x',
        vendor: 'Docker Inc.',
        website: 'https://www.docker.com',
        license: 'Apache-2.0',
        tags: ['containers', 'devops', 'deployment'],
      },
    },
    {
      name: 'Kubernetes',
      description: 'Container orchestration platform',
      attributes: {
        type: 'platform',
        recommendation: 'adopt',
        version: '1.28',
        vendor: 'CNCF',
        website: 'https://kubernetes.io',
        license: 'Apache-2.0',
        tags: ['containers', 'orchestration', 'cloud-native'],
      },
    },
    {
      name: 'COBOL',
      description: 'Legacy programming language for mainframes',
      attributes: {
        type: 'language',
        recommendation: 'retire',
        version: 'COBOL-85',
        vendor: 'Various',
        license: 'Various',
        tags: ['legacy', 'mainframe'],
      },
    },
  ];

  return Promise.all(
    technologies.map((tech) =>
      prisma.entity.create({
        data: {
          entityType: 'technology',
          name: tech.name,
          description: tech.description,
          attributes: tech.attributes,
          updatedBy: 'seed',
          tenantId,
        },
      }),
    ),
  );
}

async function seedITAssets() {
  const assets = [
    {
      name: 'PROD-DB-01',
      description: 'Primary PostgreSQL database cluster',
      attributes: {
        type: 'database',
        hostingType: 'public-cloud',
        location: 'AWS us-east-1',
        status: 'online',
        environment: 'production',
      },
    },
    {
      name: 'PROD-DB-02',
      description: 'Oracle database server',
      attributes: {
        type: 'database',
        hostingType: 'on-premise',
        location: 'On-premise DC1',
        status: 'online',
        environment: 'production',
      },
    },
    {
      name: 'APP-SERVER-01',
      description: 'Application server cluster',
      attributes: {
        type: 'server',
        hostingType: 'public-cloud',
        location: 'AWS us-east-1',
        status: 'online',
        environment: 'production',
      },
    },
    {
      name: 'LEGACY-MAINFRAME',
      description: 'IBM mainframe for legacy systems',
      attributes: {
        type: 'server',
        hostingType: 'on-premise',
        location: 'On-premise DC2',
        status: 'online',
        environment: 'production',
      },
    },
    {
      name: 'AZURE-STORAGE',
      description: 'Azure Blob Storage for documents',
      attributes: {
        type: 'storage',
        hostingType: 'public-cloud',
        location: 'Azure West US',
        status: 'online',
        environment: 'production',
      },
    },
    {
      name: 'K8S-CLUSTER',
      description: 'Kubernetes cluster for microservices',
      attributes: {
        type: 'cloud-service',
        hostingType: 'public-cloud',
        location: 'GCP us-central1',
        status: 'online',
        environment: 'production',
      },
    },
    {
      name: 'VPN-GATEWAY',
      description: 'Site-to-site VPN gateway',
      attributes: {
        type: 'network',
        hostingType: 'on-premise',
        location: 'On-premise DC1',
        status: 'online',
        environment: 'production',
      },
    },
    {
      name: 'DEV-SERVER-01',
      description: 'Development server for testing',
      attributes: {
        type: 'server',
        hostingType: 'public-cloud',
        location: 'AWS us-east-1',
        status: 'online',
        environment: 'development',
      },
    },
  ];

  return Promise.all(
    assets.map((asset) =>
      prisma.entity.create({
        data: {
          entityType: 'it_asset',
          name: asset.name,
          description: asset.description,
          attributes: asset.attributes,
          updatedBy: 'seed',
          tenantId,
        },
      }),
    ),
  );
}

async function seedBusinessCapabilities() {
  const capabilities = [
    {
      name: 'Customer Relationship Management',
      description: 'Managing customer interactions and relationships',
      attributes: { level: 1, status: 'active', domain: 'Sales' },
    },
    {
      name: 'Financial Reporting',
      description: 'Generating financial reports and analytics',
      attributes: { level: 1, status: 'active', domain: 'Finance' },
    },
    {
      name: 'Human Resource Management',
      description: 'Managing employee lifecycle and HR processes',
      attributes: { level: 1, status: 'active', domain: 'HR' },
    },
    {
      name: 'Inventory Management',
      description: 'Tracking and managing inventory levels',
      attributes: { level: 1, status: 'active', domain: 'Operations' },
    },
    {
      name: 'Marketing Automation',
      description: 'Automating marketing campaigns and communications',
      attributes: { level: 1, status: 'active', domain: 'Marketing' },
    },
    {
      name: 'Order Processing',
      description: 'Processing and fulfilling customer orders',
      attributes: { level: 2, status: 'active', domain: 'Sales' },
    },
    {
      name: 'Customer Support',
      description: 'Providing customer service and support',
      attributes: { level: 2, status: 'active', domain: 'Service' },
    },
    {
      name: 'Lead Management',
      description: 'Managing sales leads and opportunities',
      attributes: { level: 2, status: 'active', domain: 'Sales' },
    },
  ];

  return Promise.all(
    capabilities.map((cap) =>
      prisma.entity.create({
        data: {
          entityType: 'business_capability',
          name: cap.name,
          description: cap.description,
          attributes: cap.attributes,
          updatedBy: 'seed',
          tenantId,
        },
      }),
    ),
  );
}

async function seedDataObjects() {
  const dataObjects = [
    {
      name: 'Customer Data',
      description: 'Customer personal and contact information',
      attributes: {
        category: 'master-data',
        classification: 'confidential',
        owner: 'Sales',
        retentionPeriodDays: 2555,
        attributes: ['customer_id', 'first_name', 'last_name', 'email', 'phone', 'address'],
        isPersonalData: true,
        regulatoryScope: ['GDPR', 'CCPA'],
        dataResidency: 'EU',
        confidentiality: 'high',
        integrity: 'high',
        availability: 'medium',
        authenticity: 'high',
      },
    },
    {
      name: 'Sales Transactions',
      description: 'Sales order and transaction records',
      attributes: {
        category: 'transactional',
        classification: 'internal',
        owner: 'Sales',
        retentionPeriodDays: 3650,
        attributes: ['order_id', 'customer_id', 'amount', 'date', 'status'],
        isPersonalData: false,
        confidentiality: 'medium',
        integrity: 'high',
        availability: 'medium',
        authenticity: 'high',
      },
    },
    {
      name: 'Employee Records',
      description: 'Employee personal and employment data',
      attributes: {
        category: 'master-data',
        classification: 'restricted',
        owner: 'HR',
        retentionPeriodDays: 18250,
        attributes: ['employee_id', 'ssn', 'salary', 'bank_details', 'performance_reviews'],
        isPersonalData: true,
        regulatoryScope: ['GDPR', 'Labor Law'],
        dataResidency: 'EU',
        confidentiality: 'critical',
        integrity: 'critical',
        availability: 'medium',
        authenticity: 'critical',
      },
    },
    {
      name: 'Payroll Data',
      description: 'Employee salary and compensation information',
      attributes: {
        category: 'transactional',
        classification: 'restricted',
        owner: 'HR',
        retentionPeriodDays: 2555,
        attributes: ['payroll_id', 'employee_id', 'amount', 'tax_deductions', 'pay_date'],
        isPersonalData: true,
        regulatoryScope: ['GDPR', 'Tax Law'],
        dataResidency: 'EU',
        confidentiality: 'critical',
        integrity: 'critical',
        availability: 'critical',
        authenticity: 'critical',
      },
    },
    {
      name: 'Financial Statements',
      description: 'Company financial reports and statements',
      attributes: {
        category: 'reference',
        classification: 'confidential',
        owner: 'Finance',
        retentionPeriodDays: 36500,
        attributes: ['report_id', 'period', 'revenue', 'expenses', 'profit'],
        isPersonalData: false,
        regulatoryScope: ['SOX', 'IFRS'],
        confidentiality: 'high',
        integrity: 'critical',
        availability: 'high',
        authenticity: 'critical',
      },
    },
    {
      name: 'Inventory Records',
      description: 'Product inventory levels and movements',
      attributes: {
        category: 'transactional',
        classification: 'internal',
        owner: 'Operations',
        retentionPeriodDays: 1825,
        attributes: ['sku', 'quantity', 'location', 'movement_date'],
        isPersonalData: false,
        confidentiality: 'internal',
        integrity: 'high',
        availability: 'medium',
        authenticity: 'medium',
      },
    },
  ];

  return Promise.all(
    dataObjects.map((obj) =>
      prisma.entity.create({
        data: {
          entityType: 'data_object',
          name: obj.name,
          description: obj.description,
          attributes: obj.attributes,
          updatedBy: 'seed',
          tenantId,
        },
      }),
    ),
  );
}

async function seedInterfaces() {
  const interfaces = [
    {
      name: 'CRM-ERP Integration',
      description: 'Real-time sync between CRM and ERP systems',
      attributes: {
        type: 'api',
        direction: 'bidirectional',
        protocol: 'REST',
        frequency: 'real-time',
        slaLevel: 'gold',
        status: 'active',
      },
    },
    {
      name: 'HR-Payroll Feed',
      description: 'Daily employee data feed to payroll system',
      attributes: {
        type: 'file',
        direction: 'outbound',
        protocol: 'SFTP',
        frequency: 'daily',
        slaLevel: 'silver',
        status: 'active',
      },
    },
    {
      name: 'Customer Portal API',
      description: 'Public API for customer self-service portal',
      attributes: {
        type: 'api',
        direction: 'inbound',
        protocol: 'REST',
        frequency: 'real-time',
        slaLevel: 'gold',
        status: 'active',
      },
    },
    {
      name: 'Legacy Mainframe Bridge',
      description: 'Integration with legacy mainframe systems',
      attributes: {
        type: 'message-queue',
        direction: 'bidirectional',
        protocol: 'MQ',
        frequency: 'batch',
        slaLevel: 'bronze',
        status: 'active',
      },
    },
  ];

  return Promise.all(
    interfaces.map((iface) =>
      prisma.entity.create({
        data: {
          entityType: 'interface',
          name: iface.name,
          description: iface.description,
          attributes: iface.attributes,
          updatedBy: 'seed',
          tenantId,
        },
      }),
    ),
  );
}

async function seedProcesses() {
  const processes = [
    {
      name: 'Order to Cash',
      description: 'End-to-end process from order placement to payment collection',
      attributes: {
        type: 'core',
        owner: 'Sales',
        status: 'active',
        automationLevel: 'high',
        criticality: 'critical',
        rto: 4,
        rpo: 1,
        mtpd: 24,
        businessImpact: 'major',
        financialImpactPerHour: 50000,
        regulatoryScope: ['SOX'],
        recoveryProcedureDoc: 'https://wiki/otc-recovery',
        testingFrequency: 'semi-annually',
      },
    },
    {
      name: 'Hire to Retire',
      description: 'Employee lifecycle from hiring to retirement',
      attributes: {
        type: 'support',
        owner: 'HR',
        status: 'active',
        automationLevel: 'medium',
        criticality: 'high',
        rto: 24,
        rpo: 24,
        mtpd: 72,
        businessImpact: 'moderate',
        financialImpactPerHour: 5000,
        regulatoryScope: ['Labor Law'],
        recoveryProcedureDoc: 'https://wiki/hr-recovery',
        testingFrequency: 'annually',
      },
    },
    {
      name: 'Procure to Pay',
      description: 'Procurement process from requisition to payment',
      attributes: {
        type: 'core',
        owner: 'Finance',
        status: 'active',
        automationLevel: 'high',
        criticality: 'high',
        rto: 8,
        rpo: 4,
        mtpd: 48,
        businessImpact: 'major',
        financialImpactPerHour: 20000,
        regulatoryScope: ['SOX'],
        testingFrequency: 'annually',
      },
    },
    {
      name: 'Incident Management',
      description: 'IT incident detection, response, and resolution',
      attributes: {
        type: 'support',
        owner: 'IT',
        status: 'active',
        automationLevel: 'medium',
        criticality: 'critical',
        rto: 1,
        rpo: 0,
        mtpd: 4,
        businessImpact: 'catastrophic',
        financialImpactPerHour: 100000,
        regulatoryScope: ['DORA'],
        recoveryProcedureDoc: 'https://wiki/incident-response',
        testingFrequency: 'quarterly',
      },
    },
  ];

  return Promise.all(
    processes.map((proc) =>
      prisma.entity.create({
        data: {
          entityType: 'process',
          name: proc.name,
          description: proc.description,
          attributes: proc.attributes,
          updatedBy: 'seed',
          tenantId,
        },
      }),
    ),
  );
}

async function seedApplications() {
  const applications = [
    {
      name: 'Enterprise CRM',
      description: 'Customer relationship management system for sales and support teams',
      attributes: {
        status: 'active',
        criticality: 'critical',
        owner: 'John Smith',
        department: 'Sales',
        version: '3.2.1',
        // CIA ratings
        confidentiality: 'high',
        integrity: 'high',
        availability: 'medium',
        authenticity: 'high',
        // BIA
        rtoRequired: 4,
        rpoRequired: 1,
        mtpdRequired: 24,
        rtoCapability: 2,
        rpoCapability: 1,
        mtpdCapability: 48,
        businessImpact: 'catastrophic',
        financialImpactPerHour: 75000,
        // DORA
        testingFrequency: 'quarterly',
        lastTestedDate: '2024-10-15',
        recoveryProcedureDoc: 'https://wiki.internal/dr/crm',
        isOutsourced: false,
        // CRA
        securityContact: 'security-team@company.com',
        sbomAvailable: true,
        patchingFrequency: 'monthly',
        // Regulatory
        regulatoryScope: ['DORA', 'GDPR'],
        dataResidency: 'EU',
      },
    },
    {
      name: 'HR Management Suite',
      description: 'Human resources management including payroll, benefits, and employee records',
      attributes: {
        status: 'active',
        criticality: 'high',
        owner: 'Sarah Johnson',
        department: 'Human Resources',
        version: '2.8.0',
        // CIA ratings
        confidentiality: 'critical',
        integrity: 'high',
        availability: 'medium',
        authenticity: 'critical',
        // BIA
        rtoRequired: 8,
        rpoRequired: 4,
        mtpdRequired: 48,
        businessImpact: 'major',
        financialImpactPerHour: 25000,
        // DORA
        testingFrequency: 'semi-annually',
        thirdPartyProvider: 'SAP SuccessFactors',
        isOutsourced: true,
        exitStrategy: 'Migration to Workday within 12 months if needed',
        // Regulatory
        regulatoryScope: ['DORA', 'GDPR', 'Labor Law'],
        dataResidency: 'EU',
      },
    },
    {
      name: 'Financial Reporting',
      description: 'Financial reporting and analytics platform for executive dashboards',
      attributes: {
        status: 'active',
        criticality: 'critical',
        owner: 'Michael Chen',
        department: 'Finance',
        version: '4.1.0',
        // CIA ratings
        confidentiality: 'critical',
        integrity: 'critical',
        availability: 'high',
        authenticity: 'critical',
        // BIA
        rtoRequired: 2,
        rpoRequired: 0.5,
        mtpdRequired: 8,
        businessImpact: 'catastrophic',
        financialImpactPerHour: 150000,
        // DORA
        testingFrequency: 'monthly',
        isOutsourced: false,
        // Regulatory
        regulatoryScope: ['DORA', 'SOX', 'IFRS'],
        dataResidency: 'EU',
        complianceNotes: 'Subject to annual SOX audit',
      },
    },
    {
      name: 'Legacy Inventory System',
      description: 'Warehouse inventory tracking system - scheduled for replacement',
      attributes: {
        status: 'deprecated',
        criticality: 'medium',
        owner: 'David Brown',
        department: 'Operations',
        version: '1.5.3',
        // CIA ratings
        confidentiality: 'medium',
        integrity: 'high',
        availability: 'medium',
        authenticity: 'medium',
        // BIA
        businessImpact: 'moderate',
        // DORA
        testingFrequency: 'not-tested',
        isOutsourced: false,
        // CRA
        sbomAvailable: false,
        patchingFrequency: 'never',
        complianceNotes: 'Legacy system - no longer maintained, replacement planned Q2 2025',
      },
    },
    {
      name: 'Customer Portal',
      description: 'Self-service portal for customers to manage accounts and support tickets',
      attributes: {
        status: 'active',
        criticality: 'high',
        owner: 'Emily Davis',
        department: 'Customer Service',
        version: '2.0.5',
        // CIA ratings
        confidentiality: 'high',
        integrity: 'medium',
        availability: 'high',
        authenticity: 'high',
        // BIA
        rtoRequired: 4,
        rpoRequired: 2,
        mtpdRequired: 24,
        businessImpact: 'major',
        financialImpactPerHour: 35000,
        // DORA
        testingFrequency: 'quarterly',
        isOutsourced: false,
        // CRA
        securityContact: 'portal-security@company.com',
        vulnerabilityDisclosure: 'https://company.com/security/disclosure',
        sbomAvailable: true,
        patchingFrequency: 'weekly',
        // Regulatory
        regulatoryScope: ['DORA', 'GDPR', 'CRA'],
        dataResidency: 'EU',
      },
    },
    {
      name: 'Next-Gen Analytics',
      description: 'AI-powered analytics platform currently in development',
      attributes: {
        status: 'in-development',
        criticality: 'high',
        owner: 'Alex Turner',
        department: 'IT',
        version: '0.9.0',
      },
    },
    {
      name: 'Email Marketing Platform',
      description: 'Automated email marketing and campaign management',
      attributes: {
        status: 'active',
        criticality: 'medium',
        owner: 'Lisa Anderson',
        department: 'Marketing',
        version: '3.0.2',
      },
    },
    {
      name: 'Document Management',
      description: 'Enterprise document storage and collaboration platform',
      attributes: {
        status: 'active',
        criticality: 'high',
        owner: 'Robert Wilson',
        department: 'IT',
        version: '5.1.0',
      },
    },
  ];

  return Promise.all(
    applications.map((app) =>
      prisma.entity.create({
        data: {
          entityType: 'application',
          name: app.name,
          description: app.description,
          attributes: app.attributes,
          updatedBy: 'seed',
          tenantId,
        },
      }),
    ),
  );
}


async function seedRelations(
  users: any[],
  technologies: any[],
  assets: any[],
  capabilities: any[],
  dataObjects: any[],
  interfaces: any[],
  processes: any[],
  applications: any[],
) {
  console.log('🔗 Seeding relations...');

  const find = (entities: any[], name: string) => {
    const e = entities.find((e) => e.name === name);
    if (!e) console.warn(`⚠️  Could not find entity: ${name}`);
    return e;
  };

  const relations = [
    // --- App -> Owner (with ownershipRole attribute) ---
    { from: 'Enterprise CRM', to: 'John Smith', type: 'app_owned_by', attr: { ownershipRole: 'functional-owner' } },
    { from: 'HR Management Suite', to: 'Sarah Johnson', type: 'app_owned_by', attr: { ownershipRole: 'functional-owner' } },
    { from: 'Financial Reporting', to: 'Michael Chen', type: 'app_owned_by', attr: { ownershipRole: 'functional-owner' } },
    { from: 'Legacy Inventory System', to: 'David Brown', type: 'app_owned_by', attr: { ownershipRole: 'technical-owner' } },
    { from: 'Customer Portal', to: 'Emily Davis', type: 'app_owned_by', attr: { ownershipRole: 'functional-owner' } },
    { from: 'Next-Gen Analytics', to: 'Alex Turner', type: 'app_owned_by', attr: { ownershipRole: 'technical-owner' } },
    { from: 'Email Marketing Platform', to: 'Lisa Anderson', type: 'app_owned_by', attr: { ownershipRole: 'functional-owner' } },
    { from: 'Document Management', to: 'Robert Wilson', type: 'app_owned_by', attr: { ownershipRole: 'technical-owner' } },

    // --- App -> Technology ---
    // CRM
    { from: 'Enterprise CRM', to: 'React', type: 'app_uses_technology' },
    { from: 'Enterprise CRM', to: 'Node.js', type: 'app_uses_technology' },
    { from: 'Enterprise CRM', to: 'PostgreSQL', type: 'app_uses_technology' },
    // HR
    { from: 'HR Management Suite', to: 'Java', type: 'app_uses_technology' },
    { from: 'HR Management Suite', to: 'Oracle Database', type: 'app_uses_technology' },
    // Financial
    { from: 'Financial Reporting', to: 'Java', type: 'app_uses_technology' },
    { from: 'Financial Reporting', to: 'Spring Boot', type: 'app_uses_technology' },
    // Legacy
    { from: 'Legacy Inventory System', to: 'COBOL', type: 'app_uses_technology' },
    // Portal
    { from: 'Customer Portal', to: 'React', type: 'app_uses_technology' },
    { from: 'Customer Portal', to: 'Node.js', type: 'app_uses_technology' },
    { from: 'Customer Portal', to: 'Docker', type: 'app_uses_technology' },
    // Next Gen
    { from: 'Next-Gen Analytics', to: 'TypeScript', type: 'app_uses_technology' },
    { from: 'Next-Gen Analytics', to: 'Kubernetes', type: 'app_uses_technology' },

    // --- App -> Asset ---
    { from: 'Enterprise CRM', to: 'PROD-DB-01', type: 'app_uses_asset', attr: { environment: 'production' } },
    { from: 'Enterprise CRM', to: 'APP-SERVER-01', type: 'app_uses_asset', attr: { environment: 'production' } },
    { from: 'HR Management Suite', to: 'PROD-DB-02', type: 'app_uses_asset', attr: { environment: 'production' } },
    { from: 'Legacy Inventory System', to: 'LEGACY-MAINFRAME', type: 'app_uses_asset', attr: { environment: 'production' } },
    { from: 'Document Management', to: 'AZURE-STORAGE', type: 'app_uses_asset', attr: { environment: 'production' } },
    { from: 'Next-Gen Analytics', to: 'K8S-CLUSTER', type: 'app_uses_asset', attr: { environment: 'production' } },

    // --- App -> Data Object ---
    { from: 'Enterprise CRM', to: 'Customer Data', type: 'app_manages_data' },
    { from: 'Enterprise CRM', to: 'Sales Transactions', type: 'app_manages_data' },
    { from: 'HR Management Suite', to: 'Employee Records', type: 'app_manages_data' },
    { from: 'HR Management Suite', to: 'Payroll Data', type: 'app_manages_data' },
    { from: 'Financial Reporting', to: 'Financial Statements', type: 'app_manages_data' },
    { from: 'Legacy Inventory System', to: 'Inventory Records', type: 'app_manages_data' },

    // --- App -> Business Capability ---
    { from: 'Enterprise CRM', to: 'Customer Relationship Management', type: 'app_supports_capability' },
    { from: 'Enterprise CRM', to: 'Lead Management', type: 'app_supports_capability' },
    { from: 'HR Management Suite', to: 'Human Resource Management', type: 'app_supports_capability' },
    { from: 'Financial Reporting', to: 'Financial Reporting', type: 'app_supports_capability' },
    { from: 'Legacy Inventory System', to: 'Inventory Management', type: 'app_supports_capability' },
    { from: 'Email Marketing Platform', to: 'Marketing Automation', type: 'app_supports_capability' },
    { from: 'Customer Portal', to: 'Customer Support', type: 'app_supports_capability' },

    // --- Process -> App ---
    { from: 'Order to Cash', to: 'Enterprise CRM', type: 'process_uses_app' },
    { from: 'Hire to Retire', to: 'HR Management Suite', type: 'process_uses_app' },
    { from: 'Procure to Pay', to: 'Financial Reporting', type: 'process_uses_app' },
    { from: 'Incident Management', to: 'Document Management', type: 'process_uses_app' },

    // --- Interface -> App (Owned By) ---
    { from: 'CRM-ERP Integration', to: 'Enterprise CRM', type: 'interface_owned_by' },
    { from: 'HR-Payroll Feed', to: 'HR Management Suite', type: 'interface_owned_by' },
    { from: 'Customer Portal API', to: 'Customer Portal', type: 'interface_owned_by' },
    { from: 'Legacy Mainframe Bridge', to: 'Legacy Inventory System', type: 'interface_owned_by' },
  ];

  let count = 0;
  for (const rel of relations) {
    let fromEntity: any, toEntity: any;

    // Resolve From Entity
    if (rel.type.startsWith('app_')) fromEntity = find(applications, rel.from);
    else if (rel.type.startsWith('process_')) fromEntity = find(processes, rel.from);
    else if (rel.type.startsWith('interface_')) fromEntity = find(interfaces, rel.from);
    else if (rel.type.startsWith('asset_')) fromEntity = find(assets, rel.from);
    else if (rel.type.startsWith('capability_')) fromEntity = find(capabilities, rel.from);

    // Resolve To Entity
    if (rel.type === 'app_owned_by') toEntity = find(users, rel.to);
    else if (rel.type === 'interface_owned_by') toEntity = find(applications, rel.to);
    else if (rel.type.endsWith('technology')) toEntity = find(technologies, rel.to);
    else if (rel.type.endsWith('asset')) toEntity = find(assets, rel.to);
    else if (rel.type.endsWith('data')) toEntity = find(dataObjects, rel.to);
    else if (rel.type.endsWith('capability')) toEntity = find(capabilities, rel.to);
    else if (rel.type.endsWith('app')) toEntity = find(applications, rel.to);
    else if (rel.type.endsWith('interface')) toEntity = find(interfaces, rel.to);

    if (fromEntity && toEntity) {
      await prisma.relation.create({
        data: {
          relationType: rel.type,
          fromEntityId: fromEntity.id,
          toEntityId: toEntity.id,
          attributes: rel.attr || {},
          updatedBy: 'seed',
          tenantId,
        },
      });
      count++;
    }
  }
  return count;
}
