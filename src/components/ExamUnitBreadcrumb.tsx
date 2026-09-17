import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type Props = {
  examId: string;
  examName: string;
  unitId?: string;
  unitNumber?: number;
  unitName?: string;
  // Last crumb (non-link), e.g. "Pregunta".
  current?: string;
};

// "Examen › 3. Unidad › Pregunta" — the exam links to its syllabus page and
// the unit to its filtered question list.
export function ExamUnitBreadcrumb({
  examId,
  examName,
  unitId,
  unitNumber,
  unitName,
  current,
}: Props) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to={`/explore/syllabus/${examId}`} />}>
            {examName}
          </BreadcrumbLink>
        </BreadcrumbItem>
        {unitId && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to={`/explore/questions?unit=${unitId}`} />}>
                {unitNumber}. {unitName}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        {current && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{current}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
