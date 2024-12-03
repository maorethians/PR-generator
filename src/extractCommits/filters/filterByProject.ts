import { Repository } from "./types";

const blacklist = [
  "hello-algo",
  "java-design-patterns",
  "Java",
  "Stirling-PDF",
  "dubbo",
  "tutorials",
  "ruoyi-vue-pro",
  "shardingsphere",
  "RxJava",
  "FizzBuzzEnterpriseEdition",
];

export const filterByProject = (repo: Repository) =>
  !blacklist.includes(repo.name);
