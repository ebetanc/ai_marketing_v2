// Central route registry (lazy loaded for code splitting)
import React, { lazy } from "react";

// Small helper to reduce repetition when default vs named exports differ
const d = (p: Promise<any>) => p.then((m) => ({ default: m.default || m }));

// Public (auth) routes - mostly default exports
const Login = lazy(() => d(import("@/pages/Login")));
const SignUp = lazy(() => d(import("@/pages/SignUp")));
const ForgotPassword = lazy(() => d(import("@/pages/ForgotPassword")));
const ResetPassword = lazy(() => d(import("@/pages/ResetPassword")));

// Protected routes (mix of named + default). For named exports we map to a synthetic default.
const Dashboard = lazy(() =>
  import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const Brands = lazy(() =>
  import("@/pages/Brands").then((m) => ({ default: m.Brands })),
);
const Companies = lazy(() =>
  import("@/pages/Companies").then((m) => ({ default: m.Companies })),
);
const Strategies = lazy(() =>
  import("@/pages/Strategies").then((m) => ({ default: m.Strategies })),
);
const Ideas = lazy(() =>
  import("@/pages/Ideas").then((m) => ({ default: m.Ideas })),
);
const Content = lazy(() =>
  import("@/pages/Content").then((m) => ({ default: m.Content })),
);
const Calendar = lazy(() =>
  import("@/pages/Calendar").then((m) => ({ default: m.Calendar })),
);
// Product Campaign page (file exports AiProductCampaign as both named + default)
const ProductCampaign = lazy(() => d(import("@/pages/AiProductCampaign")));
const YouTubeSEO = lazy(() =>
  import("@/pages/YouTubeSEO").then((m) => ({ default: m.YouTubeSEO })),
);
const TrendBlog = lazy(() =>
  import("@/pages/TrendBlog").then((m) => ({ default: m.TrendBlog })),
);
const SemanticSEO = lazy(() =>
  import("@/pages/SemanticSEO").then((m) => ({ default: m.SemanticSEO })),
);
const KeywordResearch = lazy(() =>
  import("@/pages/KeywordResearch").then((m) => ({
    default: m.KeywordResearch,
  })),
);
const RealEstateContent = lazy(() =>
  import("@/pages/RealEstateContent").then((m) => ({
    default: m.RealEstateContent,
  })),
);
const Account = lazy(() =>
  import("@/pages/Account").then((m) => ({ default: m.Account })),
);
const CreateAIVideoPage = lazy(() =>
  import("@/pages/AiCreateVideo").then((m) => ({ default: m.CreateAiVideo })),
);
const CreateAIImage = lazy(() =>
  import("@/pages/AiCreateImage").then((m) => ({ default: m.CreateAIImage })),
);
const EditImageWithAI = lazy(() =>
  import("@/pages/AiEditImage").then((m) => ({
    default: m.EditImageWithAI,
  })),
);
const AnimateImageWithAI = lazy(() =>
  import("@/pages/AiAnimateImage").then((m) => ({
    default: m.AnimateImageWithAI,
  })),
);
const CreateVideoAvatar = lazy(() =>
  import("@/pages/AiVideoWithAvatar").then((m) => ({
    default: m.CreateVideoAvatar,
  })),
);

// Raw dynamic import functions for prefetch (kept separate from React.lazy wrappers)
// Keys align with route paths for simple lookup.
export const routeDynamicImports: Record<string, () => Promise<any>> = {
  "/login": () => import("@/pages/Login"),
  "/signup": () => import("@/pages/SignUp"),
  "/forgot-password": () => import("@/pages/ForgotPassword"),
  "/reset-password": () => import("@/pages/ResetPassword"),
  "/dashboard": () => import("@/pages/Dashboard"),
  "/companies": () => import("@/pages/Companies"),
  "/brands": () => import("@/pages/Brands"),
  "/strategies": () => import("@/pages/Strategies"),
  "/ideas": () => import("@/pages/Ideas"),
  "/content": () => import("@/pages/Content"),
  "/calendar": () => import("@/pages/Calendar"),
  "/campaigns": () => import("@/pages/AiProductCampaign"),
  "/youtube-seo": () => import("@/pages/YouTubeSEO"),
  "/trend-blog": () => import("@/pages/TrendBlog"),
  "/semantic-seo": () => import("@/pages/SemanticSEO"),
  "/keyword-research": () => import("@/pages/KeywordResearch"),
  "/create-ai-video": () => import("@/pages/AiCreateVideo"),
  "/create-ai-image": () => import("@/pages/AiCreateImage"),
  "/edit-image-with-ai": () => import("@/pages/AiEditImage"),
  "/animate-image-with-ai": () => import("@/pages/AiAnimateImage"),
  "/real-estate-content": () => import("@/pages/RealEstateContent"),
  "/create-video-avatar": () => import("@/pages/AiVideoWithAvatar"),
  "/account": () => import("@/pages/Account"),
};

export interface RouteDescriptor {
  path: string;
  component: React.ComponentType<any>;
  public?: boolean;
}

export const publicRoutes: RouteDescriptor[] = [
  { path: "/login", component: Login, public: true },
  { path: "/signup", component: SignUp, public: true },
  { path: "/forgot-password", component: ForgotPassword, public: true },
  { path: "/reset-password", component: ResetPassword, public: true },
];

export const protectedRoutes: RouteDescriptor[] = [
  { path: "/dashboard", component: Dashboard },
  { path: "/companies", component: Companies },
  { path: "/brands", component: Brands },
  { path: "/strategies", component: Strategies },
  { path: "/ideas", component: Ideas },
  { path: "/content", component: Content },
  { path: "/calendar", component: Calendar },
  { path: "/campaigns", component: ProductCampaign },
  { path: "/youtube-seo", component: YouTubeSEO },
  { path: "/trend-blog", component: TrendBlog },
  { path: "/semantic-seo", component: SemanticSEO },
  { path: "/keyword-research", component: KeywordResearch },
  { path: "/create-ai-video", component: CreateAIVideoPage },
  { path: "/create-ai-image", component: CreateAIImage },
  { path: "/edit-image-with-ai", component: EditImageWithAI },
  { path: "/animate-image-with-ai", component: AnimateImageWithAI },
  { path: "/real-estate-content", component: RealEstateContent },
  { path: "/create-video-avatar", component: CreateVideoAvatar },
  { path: "/account", component: Account },
];

// Convenience aggregate if needed elsewhere
export const allRoutes = [...publicRoutes, ...protectedRoutes];
