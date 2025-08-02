#!/bin/bash

# Linux快速部署脚本
# 营销中心周复盘系统

set -e

echo "🚀 开始部署营销中心周复盘系统..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查系统要求
check_requirements() {
    log_info "检查系统要求..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    # 检查Docker服务
    if ! systemctl is-active --quiet docker; then
        log_warn "Docker服务未启动，正在启动..."
        sudo systemctl start docker
    fi
    
    log_info "系统要求检查通过"
}

# 检查端口可用性
check_ports() {
    log_info "检查端口可用性..."
    
    local ports=(6092 6093 3306)
    
    for port in "${ports[@]}"; do
        if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
            log_warn "端口 $port 已被占用"
        else
            log_info "端口 $port 可用"
        fi
    done
}

# 备份现有数据
backup_data() {
    if [ -f "docker-compose.yml" ] && docker-compose ps | grep -q "Up"; then
        log_info "备份现有数据..."
        
        # 创建备份目录
        mkdir -p backups/$(date +%Y%m%d_%H%M%S)
        
        # 备份数据库
        if docker-compose exec -T mysql mysqldump -u root sales_review > backups/$(date +%Y%m%d_%H%M%S)/database.sql 2>/dev/null; then
            log_info "数据库备份完成"
        else
            log_warn "数据库备份失败（可能是首次部署）"
        fi
        
        # 备份配置文件
        cp conf.yaml backups/$(date +%Y%m%d_%H%M%S)/conf.yaml 2>/dev/null || true
        cp backend/config.env backups/$(date +%Y%m%d_%H%M%S)/config.env 2>/dev/null || true
    fi
}

# 停止现有服务
stop_services() {
    log_info "停止现有服务..."
    docker-compose down 2>/dev/null || true
}

# 准备配置文件
prepare_config() {
    log_info "准备配置文件..."
    
    # 复制配置文件模板
    if [ ! -f "conf.yaml" ]; then
        if [ -f "conf.yaml.example" ]; then
            cp conf.yaml.example conf.yaml
            log_info "配置文件已创建"
        else
            log_error "配置文件模板不存在"
            exit 1
        fi
    fi
    
    # 设置文件权限
    chmod +x docker-entrypoint.sh 2>/dev/null || true
}

# 构建和启动服务
start_services() {
    log_info "构建和启动服务..."
    
    # 构建镜像
    log_info "构建Docker镜像..."
    docker-compose build --no-cache
    
    # 启动服务
    log_info "启动服务..."
    docker-compose up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."
    
    # 检查容器状态
    if docker-compose ps | grep -q "Up"; then
        log_info "所有容器已启动"
    else
        log_error "部分容器启动失败"
        docker-compose ps
        exit 1
    fi
    
    # 检查健康状态
    log_info "检查健康状态..."
    if curl -f http://localhost:6093/health > /dev/null 2>&1; then
        log_info "后端服务健康检查通过"
    else
        log_warn "后端服务健康检查失败，等待重试..."
        sleep 10
        if curl -f http://localhost:6093/health > /dev/null 2>&1; then
            log_info "后端服务健康检查通过"
        else
            log_error "后端服务健康检查失败"
        fi
    fi
    
    # 检查前端服务
    if curl -f http://localhost:6092 > /dev/null 2>&1; then
        log_info "前端服务可访问"
    else
        log_warn "前端服务暂时不可访问，可能需要更多时间启动"
    fi
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo "🎉 部署完成！"
    echo ""
    echo "📊 服务信息:"
    echo "  前端地址: http://localhost:6092"
    echo "  后端地址: http://localhost:6093"
    echo "  健康检查: http://localhost:6093/health"
    echo "  MySQL地址: localhost:3306"
    echo ""
    echo "🔧 管理命令:"
    echo "  查看服务状态: docker-compose ps"
    echo "  查看日志: docker-compose logs -f"
    echo "  停止服务: docker-compose down"
    echo "  重启服务: docker-compose restart"
    echo ""
    echo "📝 默认用户:"
    echo "  张三 (ID: 1)"
    echo "  李四 (ID: 2)"
    echo ""
    echo "⚠️  注意事项:"
    echo "  1. 首次访问可能需要等待几分钟让服务完全启动"
    echo "  2. 如果遇到问题，请查看日志: docker-compose logs"
    echo "  3. 生产环境请修改默认密码和配置"
    echo ""
}

# 主函数
main() {
    echo "=========================================="
    echo "  营销中心周复盘系统 - Linux部署脚本"
    echo "=========================================="
    echo ""
    
    # 检查是否在项目根目录
    if [ ! -f "docker-compose.yml" ]; then
        log_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 执行部署步骤
    check_requirements
    check_ports
    backup_data
    stop_services
    prepare_config
    start_services
    check_services
    show_deployment_info
}

# 运行主函数
main "$@" 