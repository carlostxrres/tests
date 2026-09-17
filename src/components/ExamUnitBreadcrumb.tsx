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
  examName: string;
  unitId?: string;
  unitNumber?: number;
  unitName?: string;
  // Last crumb (non-link), e.g. "Pregunta".
  current?: string;
};

// "Examen › 3. Unidad › Pregunta" — the exam has no detail page of its own
// (its content lives inline in /explore/syllabus's accordion), so only the
// unit links to its filtered question list.
export function ExamUnitBreadcrumb({ examName, unitId, unitNumber, unitName, current }: Props) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>{examName}</BreadcrumbItem>
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
