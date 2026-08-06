import { AiGenerateList } from '../../components/AiGenerateList';
import PageHeader from '../../components/common/PageHeader';

export default function AIGenerateListPage() {
  return (
    <div className="fade-in space-y-6">
      <PageHeader
        title="AI Selection Intelligence"
        subtitle="Generate ranked athlete lists with confidence scoring and export options."
        breadcrumb="AI Intelligence"
      />
      <AiGenerateList scopeNote="Generate ranked athlete lists using academy performance, fitness, attendance and selection intelligence." />
    </div>
  );
}

