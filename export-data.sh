#!/bin/bash

# 数据导出脚本
# 用于备份营销中心周复盘系统的数据

set -e

echo "📦 开始导出数据..."

# 创建导出目录
EXPORT_DIR="exports/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$EXPORT_DIR"

echo "📁 导出目录: $EXPORT_DIR"

# 导出数据库
echo "🗄️  导出数据库..."
if mysql -u root sales_review -e "SELECT 1" > /dev/null 2>&1; then
    mysqldump -u root sales_review > "$EXPORT_DIR/database.sql"
    echo "✅ 数据库导出完成: $EXPORT_DIR/database.sql"
else
    echo "❌ 数据库连接失败"
    exit 1
fi

# 导出配置文件
echo "⚙️  导出配置文件..."
cp conf.yaml "$EXPORT_DIR/" 2>/dev/null || echo "⚠️  配置文件不存在"
cp backend/config.env "$EXPORT_DIR/" 2>/dev/null || echo "⚠️  后端配置文件不存在"

# 导出报告文件
echo "📄 导出报告文件..."
if [ -d "backend/reports" ]; then
    cp -r backend/reports "$EXPORT_DIR/" 2>/dev/null || echo "⚠️  报告文件导出失败"
    echo "✅ 报告文件导出完成"
else
    echo "⚠️  报告目录不存在"
fi

# 导出上传文件
echo "📁 导出上传文件..."
if [ -d "backend/uploads" ]; then
    cp -r backend/uploads "$EXPORT_DIR/" 2>/dev/null || echo "⚠️  上传文件导出失败"
    echo "✅ 上传文件导出完成"
else
    echo "⚠️  上传目录不存在"
fi

# 创建导出信息文件
echo "📝 创建导出信息文件..."
cat > "$EXPORT_DIR/export-info.txt" << EOF
营销中心周复盘系统 - 数据导出信息

导出时间: $(date)
导出目录: $EXPORT_DIR

包含内容:
- database.sql: 数据库完整备份
- conf.yaml: 主配置文件
- config.env: 后端环境配置
- reports/: 报告文件目录
- uploads/: 上传文件目录

导入说明:
1. 在Linux服务器上部署系统
2. 启动MySQL容器
3. 导入数据库: mysql -u root sales_review < database.sql
4. 复制配置文件到相应位置
5. 复制报告和上传文件到相应目录

注意事项:
- 请确保目标系统有足够的磁盘空间
- 导入前请备份目标系统的现有数据
- 确保文件权限正确设置
EOF

echo "✅ 导出信息文件创建完成: $EXPORT_DIR/export-info.txt"

# 创建压缩包
echo "📦 创建压缩包..."
cd exports
tar -czf "$(basename $EXPORT_DIR).tar.gz" "$(basename $EXPORT_DIR)"
cd ..

echo "✅ 数据导出完成！"
echo ""
echo "📊 导出信息:"
echo "  导出目录: $EXPORT_DIR"
echo "  压缩包: exports/$(basename $EXPORT_DIR).tar.gz"
echo "  数据库: $EXPORT_DIR/database.sql"
echo "  配置文件: $EXPORT_DIR/conf.yaml"
echo "  报告文件: $EXPORT_DIR/reports/"
echo "  上传文件: $EXPORT_DIR/uploads/"
echo ""
echo "📋 导入步骤:"
echo "  1. 将压缩包传输到Linux服务器"
echo "  2. 解压: tar -xzf $(basename $EXPORT_DIR).tar.gz"
echo "  3. 按照 export-info.txt 中的说明导入数据"
echo "" 