const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function restoreTestData() {
  const dbPath = path.join(__dirname, 'data', 'sales_review.db');
  const db = new sqlite3.Database(dbPath);
  
  console.log('🔧 开始恢复测试数据...');
  
  try {
    // 插入测试报告数据
    const testReports = [
      {
        id: 1,
        user_id: 1,
        user_name: '张三',
        date_range_start: '2025-07-21',
        date_range_end: '2025-07-27',
        review_method: 'offline',
        last_week_plan: JSON.stringify([{"task":"客户拜访","expectedResult":"完成5个客户拜访"}]),
        last_week_actions: JSON.stringify([
          {"day":"周一","morningAction":"客户A拜访","morningResult":"达成初步合作意向","eveningAction":"整理拜访记录","eveningResult":"完成"},
          {"day":"周二","morningAction":"客户B拜访","morningResult":"了解客户需求","eveningAction":"制定方案","eveningResult":"方案完成"},
          {"day":"周三","morningAction":"客户C拜访","morningResult":"签订合作协议","eveningAction":"合同准备","eveningResult":"完成"},
          {"day":"周四","morningAction":"客户D拜访","morningResult":"技术交流","eveningAction":"方案优化","eveningResult":"完成"},
          {"day":"周五","morningAction":"客户E拜访","morningResult":"商务谈判","eveningAction":"合同签署","eveningResult":"成功"}
        ]),
        week_plan: JSON.stringify([{"task":"深化客户关系","expectedResult":"客户满意度提升"}]),
        coordination_items: '需要技术支持部门配合',
        other_items: '本周重点维护客户关系',
        ai_report: '# 📊 销售周复盘报告\n\n## 📋 报告基本信息\n\n| 项目 | 内容 |\n|------|------|\n| **被复盘人** | 张三 |\n| **复盘时间区间** | 2025-07-21 至 2025-07-27 |\n| **复盘方式** | 线下复盘 |\n| **报告生成时间** | 2025-07-30 10:00:00 |\n\n## 🎯 一、上周工作成果总结\n\n### 1.1 主要成果与亮点\n\n**🏆 客户拜访成果**\n- 完成5个客户拜访，达成3个合作意向\n- 客户满意度高，反馈积极\n\n**📈 业务进展**\n- 签订2份合作协议\n- 技术交流深入，客户认可度高\n\n### 1.2 每日行动复盘\n\n| 日期 | 白天主要动作 | 白天结果 | 晚上主要动作 | 晚上结果 | 效果评估 |\n|------|--------------|----------|--------------|----------|----------|\n| **周一** | 客户A拜访 | 达成初步合作意向 | 整理拜访记录 | 完成 | 拜访效果良好 |\n| **周二** | 客户B拜访 | 了解客户需求 | 制定方案 | 方案完成 | 需求挖掘深入 |\n| **周三** | 客户C拜访 | 签订合作协议 | 合同准备 | 完成 | 合作达成 |\n| **周四** | 客户D拜访 | 技术交流 | 方案优化 | 完成 | 技术认可度高 |\n| **周五** | 客户E拜访 | 商务谈判 | 合同签署 | 成功 | 业务目标达成 |\n\n## 🎯 二、本周行动计划\n\n### 2.1 重点任务安排\n\n| 序号 | 任务内容 | 期望结果 | 完成时间 | 所需资源 |\n|------|----------|----------|----------|----------|\n| **1** | 深化客户关系 | 客户满意度提升 | 本周内 | 客户服务资源 |\n\n## 🎯 三、需协调事项\n\n- **技术支持部门配合**：提供技术方案支持\n\n**报告撰写人**：销售复盘系统分析师  \n**报告生成时间**：2025-07-30 10:00:00  \n© 2025 营销中心周复盘系统',
        is_locked: 1,
        week_id: 8,
        week_number: 30,
        created_at: '2025-07-30 10:00:00'
      },
      {
        id: 3,
        user_id: 5,
        user_name: '未知用户',
        date_range_start: '2025-07-28',
        date_range_end: '2025-08-03',
        review_method: 'offline',
        last_week_plan: JSON.stringify([]),
        last_week_actions: JSON.stringify([
          {"day":"周一","morningAction":"会见领导，推进项目回款事宜","morningResult":"领导有意愿帮忙","eveningAction":"接待领导","eveningResult":"满意"},
          {"day":"周二","morningAction":"出差外地，会见投资方","morningResult":"没见到","eveningAction":"无","eveningResult":"无"},
          {"day":"周三","morningAction":"拜访客户，沟通项目推进事宜","morningResult":"客户满意","eveningAction":"接待客户","eveningResult":"客户满意"},
          {"day":"周四","morningAction":"会见投资方，讨论项目合作","morningResult":"初步确定合作方案","eveningAction":"接待投资方","eveningResult":"投资方很满意"},
          {"day":"周五","morningAction":"参加项目推介会并签约","morningResult":"全部完成","eveningAction":"接待重要客户","eveningResult":"大家都很开心"},
          {"day":"周六","morningAction":"返回公司","morningResult":"返回公司","eveningAction":"无","eveningResult":"无"},
          {"day":"周日","morningAction":"无","morningResult":"无","eveningAction":"无","eveningResult":"无"}
        ]),
        week_plan: JSON.stringify([
          {"task":"到公司部署收款工作、更改复盘方式","expectedResult":"收款工作落实到人头，每一天都要跟进 复盘方式按照新的方式来"},
          {"task":"出差外地，对接补充协议，同时与客户确定今年要推进的项目，做好资金准备","expectedResult":"与相关部门、客户达成今年推进项目的具体实施方案和时间节点"},
          {"task":"回公司，邀请合作伙伴到公司参观，推荐我们公司的产品和服务","expectedResult":"与合作伙伴达成项目合作，未来他们跑动可以带着我们一起"}
        ]),
        coordination_items: '需要领导协调：1. 项目回款事宜的最终决策；2. 重要项目的投资审批流程。',
        other_items: '本周工作重点：推进回款工作，加强与各投资方的沟通合作。',
        ai_report: '# 📊 政府客户营销周复盘报告\n\n## 📋 报告基本信息\n\n| 项目 | 内容 |\n|------|------|\n| **被复盘人** | 未知用户 |\n| **复盘时间区间** | 2025-07-28 至 2025-08-03 |\n| **复盘方式** | 线下复盘 |\n| **报告生成时间** | 2025-07-30 14:56:58 |\n\n## 🎯 一、上周工作成果总结\n\n### 1.1 主要成果与亮点\n\n上周在政府客户营销方面取得了多项积极成果，具体包括：\n\n- **政府客户接触情况**：积极与领导会面，推进项目回款事宜，领导表现出较强的协助意愿；同时，对客户进行了实地拜访与接待，客户满意度良好。\n- **项目推进进展**：\n  - 周四与投资方深入讨论项目合作，初步达成了合作方案，投资方反馈良好。\n  - 周五成功参加了项目推介会并完成签约，任务全面达成，为后续合作奠定了基础。\n- **关键突破点**：\n  - 通过多次与投资方接触，建立了初步的合作框架。\n  - 与客户之间通过白天和晚上的双重互动，关系进一步深化，客户满意度高。\n  - 投资方和合作伙伴均对当前推进表现出高度认可和积极态度。\n\n### 1.2 上周计划完成情况分析\n\n上周无具体计划任务安排，因此无需进行任务完成度评估。但从实际行动来看，整体工作安排较为灵活，且在客户沟通和项目推进方面取得了阶段性成果。\n\n## 🎯 二、政府客户营销策略分析\n\n### 2.1 客户关系维护情况\n\n- **重点客户接触频次**：虽然未具体列出客户名称，但通过会见领导和投资方的频次可以看出，对重点客户有持续的关注和互动。\n- **客户需求挖掘深度**：在与客户沟通时，主要聚焦在项目推进和资金准备上，显示出对客户需求的初步理解，但仍需加强深度需求挖掘。\n- **客户满意度评估**：\n  - 领导与客户的反馈良好，体现出当前客户对我们的信任与支持。\n  - 周二未能成功会见投资方，可能对满意度造成一定影响，建议优化拜访策略。\n\n### 2.2 项目推进策略\n\n- **项目立项进展**：周五已成功签约，表明项目进入实质推进阶段。\n- **技术方案对接**：当前数据未具体提及技术对接内容，需在后续计划中进一步明确。\n- **商务谈判进度**：周四初步确定合作方案，为商务谈判提供了良好开端，建议本周进一步完善细节、推动落地。\n\n## 🎯 三、本周行动计划\n\n### 3.1 重点任务安排\n\n| 序号 | 任务内容 | 期望结果 | 完成时间 | 所需资源 | 风险评估 |\n|------|----------|----------|----------|----------|----------|\n| **1** | 到公司部署收款工作、更改复盘方式 | 收款工作落实到人头，每一天都要跟进；复盘方式按照新的方式执行 | 本周内 | 内部资源协调 | 中等风险，需持续跟进 |\n| **2** | 出差外地，对接补充协议，同时与客户确定今年要推进的项目，做好资金准备 | 与相关部门、客户达成今年推进项目的具体实施方案和时间节点 | 本周内 | 内部资源协调 | 中等风险，需持续跟进 |\n| **3** | 回公司，邀请合作伙伴到公司参观，推荐我们公司的产品和服务 | 与合作伙伴达成项目合作，未来他们跑动可以带着我们一起 | 本周内 | 内部资源协调 | 中等风险，需持续跟进 |\n\n### 3.2 政府客户拜访计划\n\n| 目标客户 | 拜访目的 | 拜访策略 | 预期成果 |\n|----------|----------|----------|----------|\n| **待确定客户** | 到公司部署收款工作、更改复盘方式 | 根据具体情况制定拜访策略 | 收款工作落实到人头，每一天都要跟进；复盘方式按照新的方式执行 |\n| **待确定客户** | 出差外地，对接补充协议，同时与客户确定今年要推进的项目，做好资金准备 | 根据具体情况制定拜访策略 | 与相关部门、客户达成今年推进项目的具体实施方案和时间节点 |\n| **待确定客户** | 回公司，邀请合作伙伴到公司参观，推荐我们公司的产品和服务 | 根据具体情况制定拜访策略 | 与合作伙伴达成项目合作，未来他们跑动可以带着我们一起 |\n\n## 🎯 四、需协调事项与资源需求\n\n### 4.1 领导支持事项\n\n| 事项 | 具体需求 | 紧急程度 | 预期支持方式 | 时间要求 |\n|------|----------|----------|--------------|----------|\n| **需协调事项** | 1. 项目回款事宜的最终决策；<br>2. 重要项目的投资审批流程 | 根据具体情况确定 | 领导支持与协调 | 根据项目进度确定 |\n\n### 4.2 跨部门协作需求\n\n- **财务与法务部门支持**：建议在本周部署收款工作时，提前与财务和法务部门沟通，确保补充协议条款与回款流程合规、顺畅。\n- **项目团队支持**：在与客户讨论今年项目推进计划时，建议联合项目管理团队与技术支持团队共同参与，提升客户信任和项目可行性。\n\n## 🎯 五、能力提升与改进建议\n\n### 5.1 个人能力提升\n\n- **政府客户沟通技巧**：建议提升与政府客户沟通的正式性、政策理解和需求引导能力，增强互动的专业性和权威感。\n- **项目推进能力**：需在项目签约后保持对后续流程的跟踪力，提前识别和应对潜在问题，提升项目落地效率。\n- **商务谈判技能**：在与投资方的谈判中，可以进一步学习如何在政策限制下达成双赢方案，提升谈判实力。\n\n### 5.2 工作方法优化\n\n- **客户管理流程**：建议建立客户拜访记录模板，详细记录每一次交流的重点议题、决策人、跟进事项，提高复盘的系统性。\n- **信息收集方法**：在与政府客户接触中，建议加强政策信息与行业动态的收集，以提升对客户需求的预判能力。\n- **时间管理策略**：建议优化出差时间安排，提前对接拜访对象，提高会见效率，避免时间浪费。\n\n### 5.3 团队协作改进\n\n- **内部沟通机制**：建议在项目推进任务中，建立更清晰的分工机制和进展汇报制度，确保跨部门高效协同。\n- **信息共享平台**：可建议公司搭建统一的政府客户信息共享平台，便于团队统一客户关系视图和资源调配。\n- **协同作战模式**：建议在与合作伙伴对接时，采用"销售+技术+财务"一体化协同模式，提升服务专业性和客户满意度。\n\n## 🎯 六、总结\n\n从上周的行动回顾来看，销售团队在政府客户营销方面展现出较强的执行力和客户关系维护能力，特别是在项目签约和客户接待方面取得了良好效果。然而，在与投资方的接触中，仍有提升空间，需优化拜访时间与对象安排，提高沟通效率。\n\n本周的行动计划明确，聚焦于收款部署、补充协议对接和合作伙伴关系拓展，建议在执行过程中重点关注风险控制和内部资源协调。同时，领导的支持事项直接影响项目推进的关键节点，因此建议尽快推动相关审批流程。\n\n整体来看，销售团队在政府客户营销中已初步显现成效，建议继续强化客户关系维护，提升项目推进效率，并在团队协作和信息管理方面进行系统性优化，以实现更高质量的业务成果。\n\n---\n\n**报告撰写人**： 旭普云AI智能复盘分析师  \n**被复盘人**：未知用户  \n**报告生成时间**：2025-07-30 14:56:58  \n© 2025 营销中心周复盘系统',
        is_locked: 1,
        week_id: 7,
        week_number: 30,
        created_at: '2025-07-30 14:56:58'
      }
    ];

    for (const report of testReports) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR REPLACE INTO review_reports 
          (id, user_id, user_name, date_range_start, date_range_end, review_method, 
           last_week_plan, last_week_actions, week_plan, coordination_items, other_items, 
           ai_report, is_locked, week_id, week_number, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          report.id, report.user_id, report.user_name, report.date_range_start, 
          report.date_range_end, report.review_method, report.last_week_plan, 
          report.last_week_actions, report.week_plan, report.coordination_items, 
          report.other_items, report.ai_report, report.is_locked, report.week_id, 
          report.week_number, report.created_at
        ], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    // 更新周数统计
    const weeks = await new Promise((resolve, reject) => {
      db.all('SELECT id FROM weeks', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    for (const week of weeks) {
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE weeks 
          SET 
            report_count = (
              SELECT COUNT(*) FROM review_reports WHERE week_id = ?
            ),
            locked_count = (
              SELECT COUNT(*) FROM review_reports WHERE week_id = ? AND is_locked = 1
            ),
            unlocked_count = (
              SELECT COUNT(*) FROM review_reports WHERE week_id = ? AND is_locked = 0
            ),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [week.id, week.id, week.id, week.id], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    console.log('✅ 测试数据恢复完成！');
    
    // 显示恢复后的数据
    const reports = await new Promise((resolve, reject) => {
      db.all('SELECT id, user_name, week_number FROM review_reports ORDER BY id', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log('\n📋 恢复后的报告数据：');
    for (const report of reports) {
      console.log(`报告${report.id}: ${report.user_name} - 第${report.week_number}周`);
    }

    const updatedWeeks = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          w.id,
          w.week_number,
          w.report_count,
          w.locked_count,
          w.unlocked_count
        FROM weeks w
        ORDER BY w.week_number DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log('\n📋 恢复后的周数统计：');
    for (const week of updatedWeeks) {
      console.log(`第${week.week_number}周: ${week.report_count}份报告 (锁定:${week.locked_count}, 未锁定:${week.unlocked_count})`);
    }

  } catch (error) {
    console.error('❌ 恢复测试数据失败:', error);
  } finally {
    db.close();
  }
}

restoreTestData().catch(console.error); 