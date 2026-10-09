/**
 * Mock 检索评分用分词：ASCII 按词，CJK 按 bigram。
 * 真实实现将替换为 Embedding 向量召回，此分词仅服务模拟评分。
 */
export function tokenize(query: string): string[] {
  const terms: string[] = [];
  for (const word of query.toLowerCase().match(/[a-z0-9]+/g) ?? []) {
    if (word.length >= 2) terms.push(word);
  }
  for (const run of query.match(/[\u4e00-\u9fff]+/g) ?? []) {
    if (run.length === 1) {
      terms.push(run);
    } else {
      for (let i = 0; i < run.length - 1; i++) {
        terms.push(run.slice(i, i + 2));
      }
    }
  }
  return terms;
}
