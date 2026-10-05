export type SubgroupType = "MANDATORY" | "ELECTIVE" | "FREE_ELECTIVE";

export interface CompletedSubject {
    subjectId: number;
    code: string;
    name: string;
    credits: number;
    grade: number | null;
    semester: string;
    countedAsFreeElective: boolean;
}

export interface MissingSubject {
    subjectId: number;
    code: string;
    name: string;
    credits: number;
    recommendedSemester: number | null;
}

export interface SubgroupProgress {
    id: number;
    name: string;
    type: SubgroupType;
    requiredCredits: number;
    requiredCount: number | null;
    earnedCredits: number;
    countedCredits: number;
    remainingCredits: number;
    completedCount: number;
    overflowCredits: number;
    receivedOverflowCredits: number;
    isComplete: boolean;
    completed: CompletedSubject[];
    missing: MissingSubject[];
}

export interface GroupProgress {
    id: number;
    name: string;
    isSpecialization: boolean;
    requiredCredits: number;
    requiredSubgroupCount: number;
    earnedCredits: number;
    countedCredits: number;
    remainingCredits: number;
    completedSubgroupCount: number;
    isComplete: boolean;
    subgroups: SubgroupProgress[];
}

export interface TypeTotals {
    earnedCredits: number;
    requiredCredits: number;
    countedCredits: number;
}

export interface SpecializationOption {
    id: number;
    name: string;
    requiredCredits: number;
}

export interface AbsolutoriumProgress {
    curriculum: {
        id: number;
        code: string;
        name: string;
        major: string;
        totalCreditsRequired: number;
    };
    specialization: {
        chosenId: number | null;
        options: SpecializationOption[];
    };
    totals: {
        earnedCredits: number;
        requiredCredits: number;
        remainingCredits: number;
        percent: number;
    };
    byType: Record<SubgroupType, TypeTotals>;
    groups: GroupProgress[];
    uncategorized: CompletedSubject[];
    isComplete: boolean;
}